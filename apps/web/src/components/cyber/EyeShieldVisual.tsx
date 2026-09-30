'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Lock, Fingerprint, Database, CheckCircle2 } from 'lucide-react';

export const EyeShieldVisual: React.FC = () => {
  return (
    <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
      {/* Outer Rotating Cyber Defense Rings */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-4 rounded-full border border-cyber-cyan/20 border-dashed"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-12 rounded-full border-2 border-cyber-cyan/30 border-t-transparent border-b-transparent"
      />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-20 rounded-full border border-cyber-green/30 border-l-transparent"
      />

      {/* Center Cyber Shield & Forensic Eye Symbolism */}
      <div className="relative z-10 w-44 h-44 rounded-full bg-cyber-navy/80 backdrop-blur-md border-2 border-cyber-cyan flex flex-col items-center justify-center radar-glow shadow-2xl">
        {/* Animated Scanning Beam */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full origin-center bg-gradient-to-tr from-cyber-cyan/20 via-transparent to-transparent pointer-events-none"
        />

        <div className="relative flex items-center justify-center">
          <Shield className="w-20 h-20 text-cyber-cyan stroke-[1.5] drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]" />
          <Eye className="w-10 h-10 text-cyber-green stroke-[2] absolute drop-shadow-[0_0_10px_rgba(0,255,102,0.8)]" />
        </div>

        <div className="mt-2 text-[10px] font-mono tracking-widest text-cyber-cyan font-bold uppercase">
          NETRA // SHAKTI
        </div>
      </div>

      {/* Real Defense Status Indicators surrounding HUD */}
      <div className="absolute top-2 left-2 bg-cyber-card/90 border border-cyber-border px-3 py-1.5 rounded text-[11px] font-mono flex items-center space-x-2 text-cyber-green">
        <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
        <span>WATERMARK ACTIVE</span>
      </div>

      <div className="absolute top-2 right-2 bg-cyber-card/90 border border-cyber-border px-3 py-1.5 rounded text-[11px] font-mono flex items-center space-x-2 text-cyber-cyan">
        <CheckCircle2 className="w-3.5 h-3.5 text-cyber-cyan" />
        <span>SIGNATURE VERIFIED</span>
      </div>

      <div className="absolute bottom-4 left-2 bg-cyber-card/90 border border-cyber-border px-3 py-1.5 rounded text-[11px] font-mono flex items-center space-x-2 text-cyber-gold">
        <Database className="w-3.5 h-3.5 text-cyber-gold" />
        <span>LEDGER SECURE</span>
      </div>

      <div className="absolute bottom-4 right-2 bg-cyber-card/90 border border-cyber-border px-3 py-1.5 rounded text-[11px] font-mono flex items-center space-x-2 text-cyber-green">
        <Lock className="w-3.5 h-3.5 text-cyber-green" />
        <span>AIR-GAPPED READY</span>
      </div>

      <div className="absolute -bottom-4 bg-cyber-navy/90 border border-cyber-cyan/40 px-4 py-1 rounded text-[10px] font-mono text-cyber-cyan tracking-wider">
        PQC ALGORITHMS // ML-KEM & ML-DSA ACTIVE
      </div>
    </div>
  );
};
