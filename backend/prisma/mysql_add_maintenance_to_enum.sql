-- If your `users.role` column is MySQL ENUM and does not include `maintenance` yet, run:
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'landlord', 'tenant', 'maintenance') NOT NULL;

-- After changing passwords in Workbench, always store bcrypt hashes, not plain text.
-- From the `backend` folder: npm run hash-password -- YourPassword
