/**
 * CodeGuard AI - Diff Parser
 * Parses git diff output with security hardening and validation
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../observability/logger');

// Configuration constants
const CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_DIFF_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_FILES: 1000,
  MAX_LINE_LENGTH: 10000,
  ALLOWED_EXTENSIONS: [
    '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rb', '.php',
    '.c', '.cpp', '.h', '.hpp', '.cs', '.swift', '.kt', '.rs', '.scala',
    '.sql', '.sh', '.bash', '.yaml', '.yml', '.json', '.xml', '.html',
    '.css', '.scss', '.sass', '.vue', '.tf', '.dockerfile', '.md'
  ],
  BLOCKED_PATHS: [
    '../', '..\\', // Path traversal
    '/etc/', '/proc/', '/sys/', // System directories
    'C:\\Windows\\', 'C:\\Program Files\\', // Windows system
  ],
};

/**
 * Validate file path for security
 * @param {string} filePath - File path to validate
 * @returns {boolean} True if path is safe
 */
function isPathSafe(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }

  // Check for path traversal attempts
  const normalizedPath = path.normalize(filePath).replace(/\\/g, '/');
  
  for (const blocked of CONFIG.BLOCKED_PATHS) {
    if (normalizedPath.includes(blocked)) {
      logger.warn('Blocked unsafe path', { path: filePath, reason: 'path traversal' });
      return false;
    }
  }

  // Check for null bytes
  if (filePath.includes('\0')) {
    logger.warn('Blocked path with null byte', { path: filePath });
    return false;
  }

  return true;
}

/**
 * Sanitize file path
 * @param {string} filePath - File path to sanitize
 * @returns {string} Sanitized path
 */
function sanitizePath(filePath) {
  if (!filePath) return '';
  
  // Remove leading/trailing whitespace
  let sanitized = filePath.trim();
  
  // Normalize path separators
  sanitized = sanitized.replace(/\\/g, '/');
  
  // Remove any null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove leading slashes for relative paths
  sanitized = sanitized.replace(/^\/+/, '');
  
  return sanitized;
}

/**
 * Check if file extension is allowed
 * @param {string} filePath - File path to check
 * @returns {boolean} True if extension is allowed
 */
function isExtensionAllowed(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return CONFIG.ALLOWED_EXTENSIONS.includes(ext) || ext === '';
}

/**
 * Parse a single diff hunk
 * @param {string} hunk - Diff hunk text
 * @returns {Object} Parsed hunk data
 */
function parseHunk(hunk) {
  const lines = hunk.split('\n');
  const header = lines[0];
  
  // Parse hunk header: @@ -oldStart,oldLines +newStart,newLines @@
  const match = header.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
  
  if (!match) {
    return null;
  }

  const [, oldStart, oldLines = '1', newStart, newLines = '1'] = match;
  
  const changes = [];
  let oldLineNum = parseInt(oldStart, 10);
  let newLineNum = parseInt(newStart, 10);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Validate line length
    if (line.length > CONFIG.MAX_LINE_LENGTH) {
      logger.warn('Line exceeds maximum length', { 
        lineNum: i, 
        length: line.length 
      });
      continue;
    }

    if (line.startsWith('+')) {
      changes.push({
        type: 'addition',
        content: line.substring(1),
        lineNumber: newLineNum,
      });
      newLineNum++;
    } else if (line.startsWith('-')) {
      changes.push({
        type: 'deletion',
        content: line.substring(1),
        lineNumber: oldLineNum,
      });
      oldLineNum++;
    } else if (line.startsWith(' ')) {
      changes.push({
        type: 'context',
        content: line.substring(1),
        oldLineNumber: oldLineNum,
        newLineNumber: newLineNum,
      });
      oldLineNum++;
      newLineNum++;
    }
  }

  return {
    oldStart: parseInt(oldStart, 10),
    oldLines: parseInt(oldLines, 10),
    newStart: parseInt(newStart, 10),
    newLines: parseInt(newLines, 10),
    changes,
  };
}

/**
 * Parse git diff output
 * @param {string} diffContent - Raw diff content
 * @returns {Array<Object>} Array of parsed file changes
 */
function parseDiff(diffContent) {
  if (!diffContent || typeof diffContent !== 'string') {
    throw new Error('Invalid diff content: must be a non-empty string');
  }

  // Validate diff size
  if (diffContent.length > CONFIG.MAX_DIFF_SIZE) {
    throw new Error(`Diff size exceeds maximum allowed size of ${CONFIG.MAX_DIFF_SIZE} bytes`);
  }

  const files = [];
  const diffSections = diffContent.split(/^diff --git /m).filter(Boolean);

  if (diffSections.length > CONFIG.MAX_FILES) {
    throw new Error(`Number of files (${diffSections.length}) exceeds maximum allowed (${CONFIG.MAX_FILES})`);
  }

  for (const section of diffSections) {
    try {
      const lines = section.split('\n');
      
      // Parse file paths from first line: a/path/to/file b/path/to/file
      const filePathMatch = lines[0].match(/a\/(.+?) b\/(.+)/);
      if (!filePathMatch) {
        logger.warn('Could not parse file paths from diff section');
        continue;
      }

      const [, oldPath, newPath] = filePathMatch;
      const filePath = sanitizePath(newPath || oldPath);

      // Security validation
      if (!isPathSafe(filePath)) {
        logger.warn('Skipping unsafe file path', { path: filePath });
        continue;
      }

      if (!isExtensionAllowed(filePath)) {
        logger.debug('Skipping file with disallowed extension', { path: filePath });
        continue;
      }

      // Determine change type
      let changeType = 'modified';
      if (section.includes('new file mode')) {
        changeType = 'added';
      } else if (section.includes('deleted file mode')) {
        changeType = 'deleted';
      } else if (section.includes('rename from')) {
        changeType = 'renamed';
      }

      // Parse hunks
      const hunks = [];
      const hunkRegex = /@@[^@]+@@[\s\S]*?(?=@@|$)/g;
      let hunkMatch;

      while ((hunkMatch = hunkRegex.exec(section)) !== null) {
        const parsedHunk = parseHunk(hunkMatch[0]);
        if (parsedHunk) {
          hunks.push(parsedHunk);
        }
      }

      // Calculate statistics
      const additions = hunks.reduce((sum, hunk) => 
        sum + hunk.changes.filter(c => c.type === 'addition').length, 0
      );
      const deletions = hunks.reduce((sum, hunk) => 
        sum + hunk.changes.filter(c => c.type === 'deletion').length, 0
      );

      files.push({
        path: filePath,
        oldPath: sanitizePath(oldPath),
        newPath: sanitizePath(newPath),
        changeType,
        hunks,
        additions,
        deletions,
        extension: path.extname(filePath),
      });

    } catch (error) {
      logger.error('Error parsing diff section', error);
      // Continue processing other files
    }
  }

  logger.info('Diff parsing completed', {
    filesCount: files.length,
    totalAdditions: files.reduce((sum, f) => sum + f.additions, 0),
    totalDeletions: files.reduce((sum, f) => sum + f.deletions, 0),
  });

  return files;
}

/**
 * Read and parse diff from file
 * @param {string} diffPath - Path to diff file
 * @returns {Promise<Array<Object>>} Parsed diff data
 */
async function parseDiffFromFile(diffPath) {
  try {
    // Validate path
    if (!isPathSafe(diffPath)) {
      throw new Error('Unsafe diff file path');
    }

    // Check file size before reading
    const stats = await fs.stat(diffPath);
    if (stats.size > CONFIG.MAX_DIFF_SIZE) {
      throw new Error(`Diff file size (${stats.size}) exceeds maximum allowed (${CONFIG.MAX_DIFF_SIZE})`);
    }

    logger.info('Reading diff file', { path: diffPath, size: stats.size });

    const diffContent = await fs.readFile(diffPath, 'utf8');
    return parseDiff(diffContent);

  } catch (error) {
    logger.error('Error reading diff file', error);
    throw error;
  }
}

/**
 * Extract all added/modified code from diff
 * @param {Array<Object>} parsedDiff - Parsed diff data
 * @returns {Array<Object>} Array of code snippets with metadata
 */
function extractCodeChanges(parsedDiff) {
  const codeChanges = [];

  for (const file of parsedDiff) {
    if (file.changeType === 'deleted') {
      continue; // Skip deleted files
    }

    for (const hunk of file.hunks) {
      const additions = hunk.changes.filter(c => c.type === 'addition');
      
      if (additions.length > 0) {
        codeChanges.push({
          file: file.path,
          extension: file.extension,
          startLine: hunk.newStart,
          code: additions.map(a => a.content).join('\n'),
          context: hunk.changes
            .filter(c => c.type === 'context')
            .map(c => c.content)
            .join('\n'),
        });
      }
    }
  }

  return codeChanges;
}

module.exports = {
  parseDiff,
  parseDiffFromFile,
  extractCodeChanges,
  isPathSafe,
  sanitizePath,
  isExtensionAllowed,
  CONFIG,
};

// Made with Bob
