import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  Check, 
  Copy, 
  QrCode, 
  ExternalLink, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { SupportedLanguage } from '../types/lamix';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { triggerHaptic } from '../utils/audioHaptics';

interface InstallModalProps {
  isOpen: boolean;
  language: SupportedLanguage;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  language,
  onClose,
}) => {
  const { isInstallable, isInstalled, install, isIOS, isAndroid } = usePWAInstall();
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  // The application URL
  const appUrl = typeof window !== 'undefined' ? window.location.href : '';
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl)}`;

  const handleCopyLink = () => {
    triggerHaptic(30);
    navigator.clipboard.writeText(appUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDirectInstall = async () => {
    triggerHaptic(50);
    if (isInstallable) {
      await install();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 text-slate-100 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {language === 'bn' ? 'অ্যান্ড্রয়েড ফোনে ইনস্টল করুন' : 'Install on Android Phone'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'bn' ? 'APK এর মতোই সরাসরি হোম স্ক্রিনে চলবে' : 'Runs like native app without address bar'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic(20);
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Tap Install Button if Browser Supported */}
        {isInstallable && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950 via-sky-950 to-indigo-950 border border-cyan-500/40 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>{language === 'bn' ? 'সরাসরি ইনস্টলেশন রেডি' : 'Instant 1-Tap Install'}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {language === 'bn' 
                ? 'নিচের বাটনে ট্যাপ করলেই ফোনের অ্যাপ ড্রয়ার ও হোম স্ক্রিনে ইনস্টল হয়ে যাবে।' 
                : 'Tap the button below to add Lamix Mobile to your Android apps.'}
            </p>
            <button
              onClick={handleDirectInstall}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{language === 'bn' ? 'এখনই ফোনে ইনস্টল করুন (Install Now)' : 'Install to Home Screen Now'}</span>
            </button>
          </div>
        )}

        {/* Already Installed Badge */}
        {isInstalled && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              {language === 'bn'
                ? 'অ্যাপটি ইতিমধ্যে আপনার ফোনে সফলভাবে ইনস্টল করা আছে!'
                : 'App is already running in standalone installed mode!'}
            </span>
          </div>
        )}

        {/* Step by Step Android Guide */}
        <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>{language === 'bn' ? 'অ্যান্ড্রয়েড ফোনে যেভাবে ইনস্টল করবেন (৩ ধাপ)' : 'Android Installation Steps'}</span>
          </h4>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center flex-shrink-0 text-xs border border-cyan-500/30">
                ১
              </span>
              <div className="leading-relaxed text-slate-300">
                {language === 'bn' ? (
                  <>আপনার ফোনের <strong>Google Chrome</strong> ব্রাউজারে এই অ্যাপের লিংকটি ওপেন করুন।</>
                ) : (
                  <>Open this web app link in <strong>Google Chrome</strong> on your Android phone.</>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center flex-shrink-0 text-xs border border-cyan-500/30">
                ২
              </span>
              <div className="leading-relaxed text-slate-300">
                {language === 'bn' ? (
                  <>ব্রাউজারের ওপরের ডানপাশের <strong>৩টি ডট মেনু (⋮)</strong> চাপুন।</>
                ) : (
                  <>Tap the <strong>three dots (⋮)</strong> in Chrome's top right corner.</>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center flex-shrink-0 text-xs border border-cyan-500/30">
                ৩
              </span>
              <div className="leading-relaxed text-slate-300">
                {language === 'bn' ? (
                  <>মেনু থেকে <strong>"Install app"</strong> অথবা <strong>"Add to Home screen" (হোম স্ক্রিনে যোগ করুন)</strong> বাটনে ট্যাপ করুন। ব্যস, আপনার ফোনে অ্যাপটি ইনস্টল হয়ে যাবে!</>
                ) : (
                  <>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>. The app icon will appear directly on your home screen!</>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scan QR Code & Copy Link to Phone */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span>{language === 'bn' ? 'ফোন দিয়ে QR কোড স্ক্যান করুন' : 'Scan QR Code with Phone'}</span>
            </h4>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
            <div className="p-2 bg-white rounded-xl shadow-md flex-shrink-0">
              <img
                src={qrApiUrl}
                alt="Scan to open on phone"
                className="w-32 h-32 object-contain"
              />
            </div>

            <div className="space-y-2 text-xs flex-1 text-center sm:text-left">
              <p className="text-slate-300 leading-relaxed">
                {language === 'bn'
                  ? 'আপনার মোবাইল ক্যামেরা বা গুগল লেন্স দিয়ে এই কিউআর কোড স্ক্যান করলেই সরাসরি ফোনে অ্যাপ ওপেন হবে।'
                  : 'Point your phone camera or Google Lens at this QR code to instantly launch the app on your phone.'}
              </p>

              {/* Copy URL Button */}
              <button
                onClick={handleCopyLink}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-slate-700"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{language === 'bn' ? 'লিংক কপি হয়েছে!' : 'Link Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{language === 'bn' ? 'ফোনে পাঠাতে লিংক কপি করুন' : 'Copy Link to Phone'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            triggerHaptic(20);
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
        >
          {language === 'bn' ? 'ঠিক আছে (বন্ধ করুন)' : 'Close'}
        </button>
      </div>
    </div>
  );
};
