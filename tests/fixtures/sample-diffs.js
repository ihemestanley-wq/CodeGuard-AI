/**
 * Test Fixtures - Sample Diffs
 */

module.exports = {
  simpleDiff: `diff --git a/src/app.js b/src/app.js
index 1234567..abcdefg 100644
--- a/src/app.js
+++ b/src/app.js
@@ -1,3 +1,4 @@
+const express = require('express');
 const app = express();
 
 app.listen(3000);`,

  securityIssueDiff: `diff --git a/src/database.js b/src/database.js
index 1234567..abcdefg 100644
--- a/src/database.js
+++ b/src/database.js
@@ -10,7 +10,7 @@ function getUserData(userId) {
-  const query = 'SELECT * FROM users WHERE id = ?';
+  const query = \`SELECT * FROM users WHERE id = \${userId}\`;
   return db.execute(query);
 }`,

  complexityIssueDiff: `diff --git a/src/utils.js b/src/utils.js
index 1234567..abcdefg 100644
--- a/src/utils.js
+++ b/src/utils.js
@@ -1,5 +1,20 @@
 function processData(data) {
-  return data.map(x => x * 2);
+  if (data.length > 0) {
+    if (data[0] > 10) {
+      if (data[0] < 100) {
+        if (data[0] % 2 === 0) {
+          if (data[0] % 3 === 0) {
+            if (data[0] % 5 === 0) {
+              return data.map(x => x * 2);
+            }
+          }
+        }
+      }
+    }
+  }
+  return [];
 }`,

  multiFileDiff: `diff --git a/src/auth.js b/src/auth.js
index 1234567..abcdefg 100644
--- a/src/auth.js
+++ b/src/auth.js
@@ -5,7 +5,7 @@ function authenticate(user, password) {
-  return user.password === password;
+  return bcrypt.compare(password, user.passwordHash);
 }
 
diff --git a/src/config.js b/src/config.js
index 2345678..bcdefgh 100644
--- a/src/config.js
+++ b/src/config.js
@@ -1,3 +1,4 @@
 module.exports = {
   port: 3000,
+  jwtSecret: process.env.JWT_SECRET,
 };`,

  emptyDiff: '',

  invalidDiff: 'This is not a valid diff format',
};

// Made with Bob
