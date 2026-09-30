import { prisma } from '@netra-shakti/database';

async function main() {
  const user = await prisma.user.findUnique({ where: { username: 'maj.verma' } });
  console.log('User maj.verma id:', user?.id);

  const assignments = await prisma.documentRecipient.findMany({
    where: { recipientId: user?.id }
  });
  console.log('Assignments for maj.verma:', assignments);

  const userAssignments = await prisma.documentRecipient.findMany({
    where: { recipientId: user?.id, status: { in: ['GRANTED', 'ACCESSED'] } },
    select: { documentId: true }
  });
  const docIds = userAssignments.map(a => a.documentId);
  const docs = await prisma.document.findMany({
    where: { id: { in: docIds } }
  });
  console.log('Direct ID match docs:', docs.length, docs[0]?.title);
}

main().finally(async () => {
  await prisma.$disconnect();
});
