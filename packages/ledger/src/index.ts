import { ILedgerEvent } from '@netra-shakti/shared-types';
import { canonicalizeJson, defaultCryptoService } from '@netra-shakti/crypto';

export interface CreateLedgerEventInput {
  eventType: string;
  entityType: string;
  entityId: string;
  payload: any;
  actorId: string;
  timestamp?: number | string;
}

export interface ChainVerificationResult {
  isValid: boolean;
  totalEvents: number;
  brokenAtSequence?: number;
  reason?: string;
  lastValidHash?: string;
  verifiedAt: string;
}

export const GENESIS_PREVIOUS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * NETRA SHAKTI Immutable Hash-Chained Ledger Engine
 * Defense-grade Tamper-Evident Decryption Provenance Ledger
 */
export class LedgerService {
  private readonly cryptoService = defaultCryptoService;
  private readonly systemSigner = defaultCryptoService.getSystemSigner();

  /**
   * Compute payload hash from canonical JSON
   */
  public computePayloadHash(payload: any): string {
    const canonical = canonicalizeJson(payload);
    return this.cryptoService.hash(Buffer.from(canonical, 'utf8'));
  }

  /**
   * Compute deterministic event hash for a ledger block
   */
  public computeEventHash(params: {
    sequenceNumber: number;
    eventType: string;
    entityType: string;
    entityId: string;
    payloadHash: string;
    previousHash: string;
    actorId: string;
    createdAt: string;
  }): string {
    const canonical = canonicalizeJson({
      sequenceNumber: params.sequenceNumber,
      eventType: params.eventType,
      entityType: params.entityType,
      entityId: params.entityId,
      payloadHash: params.payloadHash,
      previousHash: params.previousHash,
      actorId: params.actorId,
      createdAt: params.createdAt
    });
    return this.cryptoService.hash(Buffer.from(canonical, 'utf8'));
  }

  /**
   * Sign the event block hash
   */
  public signEventHash(eventHash: string): string {
    return this.systemSigner.sign(eventHash);
  }

  /**
   * Verify signature on event block hash
   */
  public verifyEventSignature(eventHash: string, signature: string): boolean {
    return this.systemSigner.verify(eventHash, signature);
  }

  /**
   * Construct a new ledger block appending to previous event
   */
  public createEventBlock(
    input: CreateLedgerEventInput,
    previousEvent?: ILedgerEvent | null,
    id?: string
  ): ILedgerEvent {
    const sequenceNumber = previousEvent ? previousEvent.sequenceNumber + 1 : 1;
    const previousHash = previousEvent ? previousEvent.eventHash : GENESIS_PREVIOUS_HASH;
    const payloadHash = this.computePayloadHash(input.payload);
    const createdAt = input.timestamp ? new Date(input.timestamp).toISOString() : new Date().toISOString();

    const eventHash = this.computeEventHash({
      sequenceNumber,
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      payloadHash,
      previousHash,
      actorId: input.actorId,
      createdAt
    });

    const signature = this.signEventHash(eventHash);

    return {
      id: id || `LEDGER-EVT-${sequenceNumber}-${eventHash.substring(0, 8)}`,
      sequenceNumber,
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      payloadHash,
      previousHash,
      eventHash,
      signature,
      actorId: input.actorId,
      createdAt
    };
  }

  /**
   * Verify single event integrity against its previous event
   */
  public verifySingleEvent(event: ILedgerEvent, previousEvent?: ILedgerEvent | null): { isValid: boolean; error?: string } {
    // 1. Verify previous hash link
    const expectedPreviousHash = previousEvent ? previousEvent.eventHash : GENESIS_PREVIOUS_HASH;
    if (event.previousHash !== expectedPreviousHash) {
      return {
        isValid: false,
        error: `Previous hash mismatch: expected ${expectedPreviousHash}, found ${event.previousHash}`
      };
    }

    // 2. Verify sequence number sequence
    const expectedSequence = previousEvent ? previousEvent.sequenceNumber + 1 : 1;
    if (event.sequenceNumber !== expectedSequence) {
      return {
        isValid: false,
        error: `Sequence number broken: expected ${expectedSequence}, found ${event.sequenceNumber}`
      };
    }

    // 3. Recompute and verify event hash
    const dateStr = typeof event.createdAt === 'string' ? event.createdAt : new Date(event.createdAt).toISOString();
    const computedHash = this.computeEventHash({
      sequenceNumber: event.sequenceNumber,
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      payloadHash: event.payloadHash,
      previousHash: event.previousHash,
      actorId: event.actorId,
      createdAt: dateStr
    });

    if (computedHash !== event.eventHash) {
      return {
        isValid: false,
        error: `Event hash mismatch: computed ${computedHash}, stored ${event.eventHash}`
      };
    }

    // 4. Verify cryptographic signature
    const isSigValid = this.verifyEventSignature(event.eventHash, event.signature);
    if (!isSigValid) {
      return {
        isValid: false,
        error: `Cryptographic signature invalid on event hash ${event.eventHash}`
      };
    }

    return { isValid: true };
  }

  /**
   * Verify entire hash-chain from sequence 1 to N
   */
  public verifyFullChain(events: ILedgerEvent[]): ChainVerificationResult {
    const verifiedAt = new Date().toISOString();

    if (!events || events.length === 0) {
      return {
        isValid: true,
        totalEvents: 0,
        verifiedAt
      };
    }

    // Sort by sequence number ascending
    const sorted = [...events].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      const prev = i === 0 ? null : sorted[i - 1];

      const check = this.verifySingleEvent(current, prev);
      if (!check.isValid) {
        return {
          isValid: false,
          totalEvents: sorted.length,
          brokenAtSequence: current.sequenceNumber,
          reason: check.error,
          lastValidHash: prev ? prev.eventHash : undefined,
          verifiedAt
        };
      }
    }

    return {
      isValid: true,
      totalEvents: sorted.length,
      lastValidHash: sorted[sorted.length - 1].eventHash,
      verifiedAt
    };
  }
}

export const defaultLedgerService = new LedgerService();
