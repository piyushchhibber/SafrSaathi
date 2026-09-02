import React from 'react';
import { SafrSaathiLogo } from './SafrSaathiLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-6 px-4 md:px-10 bg-[#eae8e7] border-t border-[#c6c5d4] mt-auto text-xs text-[#454652]">
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <SafrSaathiLogo size="xs" variant="horizontal" />
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          <a href="#" className="hover:text-[#000666] transition">Privacy Policy</a>
          <a href="#" className="hover:text-[#000666] transition">Terms of Service</a>
          <a href="#" className="hover:text-[#000666] transition">Disability Concessions</a>
          <a href="#" className="hover:text-[#000666] transition">Contact & Helpline (1800-180-2444)</a>
        </div>

        <span className="text-center md:text-right">
          © {new Date().getFullYear()} Punjab Roadways Transport Corporation. All Rights Reserved.
        </span>
      </div>
    </footer>
  );
};
