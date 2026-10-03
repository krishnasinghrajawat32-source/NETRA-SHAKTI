'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, Lock, Shield, ArrowRight, Clock, Users } from 'lucide-react';
import { IDocument } from '@netra-shakti/shared-types';
import StatusBadge from './StatusBadge';

interface DocumentCardProps {
  document: IDocument;
  userRole?: string;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document }) => {
  return (
    <div className="p-5 bg-cyber-card border border-cyber-border rounded hover:border-cyber-cyan/60 transition-all flex flex-col justify-between space-y-4 group">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-cyber-cyan font-bold tracking-wider">
            {document.documentCode}
          </span>
          <StatusBadge status={document.classification} />
        </div>

        <h3 className="text-sm font-mono font-bold text-white uppercase mt-2 group-hover:text-cyber-cyan transition-colors line-clamp-1">
          {document.title}
        </h3>

        {document.description && (
          <p className="text-xs font-mono text-gray-400 mt-1 line-clamp-2">
            {document.description}
          </p>
        )}
      </div>

      <div className="pt-3 border-t border-cyber-border/60 flex items-center justify-between text-[11px] font-mono text-gray-400">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <FileText className="w-3.5 h-3.5 text-cyber-muted" />
            <span>{document.pageCount} Pages</span>
          </span>
          <span className="flex items-center space-x-1">
            <Users className="w-3.5 h-3.5 text-cyber-muted" />
            <span>{document.recipients?.length ?? 0} Recipients</span>
          </span>
        </div>

        <Link
          href={`/documents/${document.id}`}
          className="text-cyber-cyan hover:underline flex items-center space-x-1 font-bold"
        >
          <span>DETAILS</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};

export default DocumentCard;
