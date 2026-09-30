import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { defaultLedgerService, GENESIS_PREVIOUS_HASH } from '../packages/ledger/src';
import { ILedgerEvent } from '../packages/shared-types/src';

describe('NETRA SHAKTI // Immutable Hash-Chained Ledger Tests', () => {
  const ledgerService = defaultLedgerService;

  test('Genesis Block: creates valid genesis event with 0000... previousHash', () => {
    const genesis = ledgerService.createEventBlock({
      eventType: 'LEDGER_GENESIS_INITIALIZATION',
      entityType: 'SYSTEM',
      entityId: 'ROOT',
      payload: { version: '1.0.0' },
      actorId: 'SUPER_ADMIN_01'
    });

    assert.equal(genesis.sequenceNumber, 1);
    assert.equal(genesis.previousHash, GENESIS_PREVIOUS_HASH);
    assert.equal(genesis.eventHash.length, 64);
    assert.ok(genesis.signature !== undefined);

    const verify = ledgerService.verifySingleEvent(genesis);
    assert.equal(verify.isValid, true);
  });

  test('Chain Sequencing: chains multiple events sequentially and verifies entire chain', () => {
    const block1 = ledgerService.createEventBlock({
      eventType: 'DOCUMENT_ENCRYPTED',
      entityType: 'DOCUMENT',
      entityId: 'DOC-01',
      payload: { docCode: 'DOC-01', hash: 'abc1' },
      actorId: 'USER-01'
    });

    const block2 = ledgerService.createEventBlock(
      {
        eventType: 'RECIPIENT_ASSIGNED',
        entityType: 'DOCUMENT_RECIPIENT',
        entityId: 'REC-01',
        payload: { recipientId: 'USER-02' },
        actorId: 'USER-01'
      },
      block1
    );

    const block3 = ledgerService.createEventBlock(
      {
        eventType: 'DOCUMENT_DECRYPTED_AND_ISSUED',
        entityType: 'DECRYPTION_SESSION',
        entityId: 'SESS-01',
        payload: { watermarkCode: 'WM-01' },
        actorId: 'USER-02'
      },
      block2
    );

    assert.equal(block2.sequenceNumber, 2);
    assert.equal(block2.previousHash, block1.eventHash);
    assert.equal(block3.sequenceNumber, 3);
    assert.equal(block3.previousHash, block2.eventHash);

    const chainResult = ledgerService.verifyFullChain([block1, block2, block3]);
    assert.equal(chainResult.isValid, true);
    assert.equal(chainResult.totalEvents, 3);
  });

  test('Tampering Detection: detects altered historical block in chain and returns broken sequence', () => {
    const block1 = ledgerService.createEventBlock({
      eventType: 'DOCUMENT_ENCRYPTED',
      entityType: 'DOCUMENT',
      entityId: 'DOC-01',
      payload: { data: 'orig' },
      actorId: 'USER-01'
    });

    const block2 = ledgerService.createEventBlock(
      {
        eventType: 'DOCUMENT_DECRYPTED_AND_ISSUED',
        entityType: 'DECRYPTION_SESSION',
        entityId: 'SESS-01',
        payload: { recipient: 'USER-02' },
        actorId: 'USER-02'
      },
      block1
    );

    const tamperedBlock1: ILedgerEvent = {
      ...block1,
      payloadHash: '0000000000000000000000000000000000000000000000000000000000000000'
    };

    const chainResult = ledgerService.verifyFullChain([tamperedBlock1, block2]);
    assert.equal(chainResult.isValid, false);
    assert.equal(chainResult.brokenAtSequence, 1);
  });
});
