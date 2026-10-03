import { prisma } from '@netra-shakti/database';
import { defaultCryptoService } from '@netra-shakti/crypto';
import { UserRole, ClearanceLevel, UserStatus } from '@netra-shakti/shared-types';

async function bootstrapAdmin() {
  console.log('=== NETRA SHAKTI // SUPER ADMIN BOOTSTRAP ===');

  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN }
  });

  const force = process.argv.includes('--force');

  if (existingSuperAdmin && !force) {
    console.log(`[INFO] Super Admin already exists: ${existingSuperAdmin.username} (${existingSuperAdmin.email})`);
    console.log('[INFO] Use --force flag if you wish to reset the SUPER_ADMIN credentials.');
    return;
  }

  const username = process.env.SUPERADMIN_USERNAME || 'netra.admin';
  const email = process.env.SUPERADMIN_EMAIL || 'admin@defence.netrashakti.gov';
  const initialPassword = process.env.SUPERADMIN_PASSWORD || 'Netra@Shakti2026!Defence';

  const passwordHash = await defaultCryptoService.hashPassword(initialPassword);

  if (existingSuperAdmin && force) {
    console.log(`[INFO] Resetting existing Super Admin credentials: ${existingSuperAdmin.username}...`);
    await prisma.user.update({
      where: { id: existingSuperAdmin.id },
      data: {
        passwordHash,
        status: UserStatus.ACTIVE,
        department: 'DEFENCE_CYBER_COMMAND'
      }
    });
    console.log(`SUCCESS: SUPER_ADMIN credentials reset for username: ${existingSuperAdmin.username}`);
    return;
  }

  const admin = await prisma.user.create({
    data: {
      username,
      email,
      displayName: 'National Cyber Security Director',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      department: 'DEFENCE_CYBER_COMMAND',
      rank: 'Director General',
      unit: 'HQ Strategic Cyber Command',
      clearanceLevel: ClearanceLevel.TOP_SECRET,
      status: UserStatus.PASSWORD_CHANGE_REQUIRED
    }
  });

  const signingKeys = defaultCryptoService.generateSigningKeyPair();
  const encryptionKeys = defaultCryptoService.generateEncryptionKeyPair();

  await prisma.cryptoIdentity.create({
    data: {
      userId: admin.id,
      signingPublicKey: signingKeys.publicKey,
      encryptionPublicKey: encryptionKeys.publicKey,
      algorithm: 'Ed25519+RSA-4096-OAEP',
      keyVersion: 1,
      status: 'ACTIVE'
    }
  });

  console.log('----------------------------------------------------');
  console.log('SUCCESS: First SUPER_ADMIN successfully initialized!');
  console.log(`Username: ${username}`);
  console.log(`Email:    ${email}`);
  console.log(`Password: ${initialPassword}`);
  console.log('Note: Password change will be required on initial login.');
  console.log('----------------------------------------------------');
}

bootstrapAdmin()
  .catch(err => {
    console.error('Bootstrap failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
