import { prisma } from '@netra-shakti/database';

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, username: true, role: true } });
  console.log('USERS:', users);

  const docs = await prisma.document.findMany({ select: { id: true, documentCode: true, title: true } });
  console.log('DOCS:', docs);

  const assignments = await prisma.documentRecipient.findMany();
  console.log('ASSIGNMENTS:', assignments);

  const sessions = await prisma.decryptionSession.findMany({ select: { id: true, sessionCode: true, recipientId: true, documentId: true } });
  console.log('SESSIONS:', sessions);
}

main().finally(async () => {
  await prisma.$disconnect();
});
