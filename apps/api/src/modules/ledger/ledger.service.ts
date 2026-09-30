import { Injectable, Logger } from '@nestjs/common';
import { prisma, Prisma } from '@netra-shakti/database';
import { defaultLedgerService, LedgerService as CoreLedgerService, CreateLedgerEventInput, ChainVerificationResult } from '@netra-shakti/ledger';
import { ILedgerEvent } from '@netra-shakti/shared-types';

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);
  public readonly core: CoreLedgerService = defaultLedgerService;

  /**
   * Append a new immutable event to the hash-chained ledger in database
   */
  async appendEvent(input: CreateLedgerEventInput): Promise<ILedgerEvent> {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Find latest event to get previousHash and sequenceNumber
      const latestEvent = await tx.ledgerEvent.findFirst({
        orderBy: { sequenceNumber: 'desc' }
      });

      const eventBlock = this.core.createEventBlock(
        input,
        latestEvent as unknown as ILedgerEvent
      );

      const created = await tx.ledgerEvent.create({
        data: {
          sequenceNumber: eventBlock.sequenceNumber,
          eventType: eventBlock.eventType,
          entityType: eventBlock.entityType,
          entityId: eventBlock.entityId,
          payloadHash: eventBlock.payloadHash,
          previousHash: eventBlock.previousHash,
          eventHash: eventBlock.eventHash,
          signature: eventBlock.signature,
          actorId: eventBlock.actorId,
          createdAt: new Date(eventBlock.createdAt)
        }
      });

      this.logger.log(`[LEDGER] Appended block #${created.sequenceNumber} [${created.eventType}] Hash: ${created.eventHash.substring(0, 16)}...`);

      return {
        ...created,
        createdAt: created.createdAt.toISOString()
      };
    });
  }

  /**
   * Verify the integrity of the entire hash-chained ledger
   */
  async verifyLedgerIntegrity(): Promise<ChainVerificationResult> {
    const allEvents = await prisma.ledgerEvent.findMany({
      orderBy: { sequenceNumber: 'asc' }
    });

    const mappedEvents: ILedgerEvent[] = allEvents.map((e: any) => ({
      id: e.id,
      sequenceNumber: e.sequenceNumber,
      eventType: e.eventType,
      entityType: e.entityType,
      entityId: e.entityId,
      payloadHash: e.payloadHash,
      previousHash: e.previousHash,
      eventHash: e.eventHash,
      signature: e.signature,
      actorId: e.actorId,
      createdAt: typeof e.createdAt === 'string' ? e.createdAt : (e.createdAt?.toISOString ? e.createdAt.toISOString() : new Date(e.createdAt).toISOString())
    }));

    return this.core.verifyFullChain(mappedEvents);
  }

  async getEvents(params: {
    eventType?: string;
    entityType?: string;
    entityId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.eventType) where.eventType = params.eventType;
    if (params.entityType) where.entityType = params.entityType;
    if (params.entityId) where.entityId = params.entityId;

    const [events, total] = await Promise.all([
      prisma.ledgerEvent.findMany({
        where,
        orderBy: { sequenceNumber: 'desc' },
        skip,
        take: limit
      }),
      prisma.ledgerEvent.count({ where })
    ]);

    return {
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getLedgerStatus() {
    const totalCount = await prisma.ledgerEvent.count();
    const latestEvent = await prisma.ledgerEvent.findFirst({
      orderBy: { sequenceNumber: 'desc' }
    });

    return {
      provider: 'LOCAL_TAMPER_EVIDENT_HASH_CHAIN',
      totalBlocks: totalCount,
      latestSequence: latestEvent ? latestEvent.sequenceNumber : 0,
      latestHash: latestEvent ? latestEvent.eventHash : null,
      isPqcReady: true,
      status: 'OPERATIONAL'
    };
  }
}
