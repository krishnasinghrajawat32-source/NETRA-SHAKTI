import { Injectable, Logger } from '@nestjs/common';
import { defaultCryptoService, CryptoService as CoreCryptoService } from '@netra-shakti/crypto';
import { prisma } from '@netra-shakti/database';
import { IProvenanceRecord } from '@netra-shakti/shared-types';

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  public readonly core: CoreCryptoService = defaultCryptoService;

  /**
   * Generate and register cryptographic identity for a user (Asymmetric signing & encryption keys)
   */
  async generateAndRegisterUserIdentity(userId: string): Promise<any> {
    const signingKeys = this.core.generateSigningKeyPair();
    const encryptionKeys = this.core.generateEncryptionKeyPair();

    const identity = await prisma.cryptoIdentity.create({
      data: {
        userId,
        signingPublicKey: signingKeys.publicKey,
        encryptionPublicKey: encryptionKeys.publicKey,
        algorithm: 'Ed25519+RSA-4096-OAEP',
        keyVersion: 1,
        status: 'ACTIVE'
      }
    });

    return {
      identity,
      signingPrivateKey: signingKeys.privateKey,
      encryptionPrivateKey: encryptionKeys.privateKey
    };
  }

  async getActiveIdentity(userId: string) {
    return prisma.cryptoIdentity.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    });
  }

  async listIdentities() {
    return prisma.cryptoIdentity.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            role: true,
            department: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  getPqcStatus() {
    return this.core.getPqcStatus();
  }
}
