// One-off helper: run `npm run hash-password -- yourPassword`
// to generate a bcrypt hash for manually seeding a user in MySQL.
const bcrypt = require('bcryptjs');

const plain = process.argv[2];
if (!plain) {
  console.log('Usage: npm run hash-password -- <plainTextPassword>');
  process.exit(1);
}

bcrypt.hash(plain, 10).then((hash) => {
  console.log('Bcrypt hash:');
  console.log(hash);
});
