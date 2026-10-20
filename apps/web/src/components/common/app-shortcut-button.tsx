import React, { useState, useEffect } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Smartphone, Monitor, Download, Share, Check, ExternalLink, Sparkles } from 'lucide-react';

interface AppShortcutButtonProps {
	variant: 'vip' | 'driver' | 'ops';
	className?: string;
	buttonLabel?: string;
	compact?: boolean;
}

const SHORTCUT_CONFIG = {
	vip: {
		title: 'BookNowLux VIP Rezervasyon',
		subtitle: 'Lüks Şoför ve Rezervasyon Deneyimi',
		iconSrc: '/icons/booking-icon.jpg',
		accentColor: 'border-amber-400/50 shadow-amber-500/20 text-amber-300',
		glowColor: 'rgba(217, 119, 6, 0.25)',
		targetUrl: 'https://booknowlux.com/',
		filename: 'BookNowLux-VIP-Rezervasyon.url',
	},
	driver: {
		title: 'BookNowLux Şoför & Sürücü',
		subtitle: 'Aktif Görev ve Canlı Sefer Takibi',
		iconSrc: '/icons/driver-icon.jpg',
		accentColor: 'border-emerald-400/50 shadow-emerald-500/20 text-emerald-300',
		glowColor: 'rgba(16, 185, 129, 0.25)',
		targetUrl: 'https://booknowlux.com/driver',
		filename: 'BookNowLux-Driver-Portal.url',
	},
	ops: {
		title: 'BookNowLux Operatör & Dispatch',
		subtitle: 'Merkezi Filo ve Sevkiyat Komuta Paneli',
		iconSrc: '/icons/operator-icon.jpg',
		accentColor: 'border-cyan-400/50 shadow-cyan-500/20 text-cyan-300',
		glowColor: 'rgba(6, 182, 212, 0.25)',
		targetUrl: 'https://booknowlux.com/dashboard',
		filename: 'BookNowLux-Operator-Dispatch.url',
	},
};

export function AppShortcutButton({
	variant,
	className = '',
	buttonLabel,
	compact = false,
}: AppShortcutButtonProps) {
	const [open, setOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<'mobile' | 'desktop'>('mobile');
	const [downloaded, setDownloaded] = useState(false);
	const config = SHORTCUT_CONFIG[variant];

	// Detect device on mount
	useEffect(() => {
		if (typeof window !== 'undefined') {
			const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
			setActiveTab(isMobile ? 'mobile' : 'desktop');
		}
	}, []);

	const handleDownloadDesktopShortcut = () => {
		const urlContent = `[InternetShortcut]\nURL=${config.targetUrl}\nIconIndex=0\nIconFile=${config.targetUrl}favicon.ico\n`;
		const blob = new Blob([urlContent], { type: 'application/octet-stream' });
		const downloadUrl = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = downloadUrl;
		a.download = config.filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(downloadUrl);
		setDownloaded(true);
		setTimeout(() => setDownloaded(false), 3000);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<button
					type="button"
					className={
						className ||
						`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-amber-400/30 bg-black/60 text-amber-200 hover:bg-amber-500/10 hover:border-amber-400/60 transition-all shadow-sm backdrop-blur-md`
					}
					title="Ana Ekrana ve Masaüstüne Kısayol Ekle"
				>
					<Smartphone className="w-3.5 h-3.5 text-amber-400" />
					{!compact && <span>{buttonLabel || 'Kısayol Oluştur'}</span>}
				</button>
			</DialogTrigger>

			<DialogContent className="max-w-md bg-zinc-950/95 border-zinc-800 text-zinc-100 backdrop-blur-xl p-6 shadow-2xl rounded-2xl">
				<DialogHeader className="space-y-3 text-center sm:text-left">
					<div className="flex items-center gap-3.5">
						<div
							className={`relative w-14 h-14 rounded-2xl overflow-hidden border p-0.5 flex-shrink-0 shadow-lg ${config.accentColor}`}
							style={{ boxShadow: `0 8px 24px ${config.glowColor}` }}
						>
							<img
								src={config.iconSrc}
								alt={config.title}
								className="w-full h-full object-cover rounded-xl"
							/>
						</div>
						<div>
							<DialogTitle className="text-base font-semibold tracking-tight text-white flex items-center gap-1.5">
								{config.title}
								<Sparkles className="w-4 h-4 text-amber-400" />
							</DialogTitle>
							<p className="text-xs text-zinc-400 mt-0.5">{config.subtitle}</p>
						</div>
					</div>
				</DialogHeader>

				{/* Tabs: Mobil & Masaüstü */}
				<div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800/80 text-xs font-medium mt-4">
					<button
						type="button"
						onClick={() => setActiveTab('mobile')}
						className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
							activeTab === 'mobile'
								? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
								: 'text-zinc-400 hover:text-zinc-200'
						}`}
					>
						<Smartphone className="w-3.5 h-3.5" />
						Mobil (iOS / Android)
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('desktop')}
						className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
							activeTab === 'desktop'
								? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
								: 'text-zinc-400 hover:text-zinc-200'
						}`}
					>
						<Monitor className="w-3.5 h-3.5" />
						Masaüstü (PC / Mac)
					</button>
				</div>

				{/* Tab Content: Mobile */}
				{activeTab === 'mobile' && (
					<div className="mt-4 space-y-3.5 text-xs">
						{/* iOS Safari */}
						<div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
							<div className="flex items-center gap-2 font-medium text-amber-300">
								<Share className="w-3.5 h-3.5" />
								<span>iPhone & iPad (Safari)</span>
							</div>
							<ol className="list-decimal list-inside space-y-1 text-zinc-300 leading-relaxed text-[11px]">
								<li>Safari'de bu sayfadayken alt kısımdaki <strong>Paylaş (⬆)</strong> butonuna dokunun.</li>
								<li>Açılan menüde aşağı kaydırıp <strong>"Ana Ekrana Ekle"</strong> seçeneğine basın.</li>
								<li>Sağ üstteki <strong>"Ekle"</strong>ye dokunun; özel tasarımlı lüks ikon ana ekranınızda bir uygulama gibi belirecektir.</li>
							</ol>
						</div>

						{/* Android Chrome */}
						<div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
							<div className="flex items-center gap-2 font-medium text-emerald-300">
								<Smartphone className="w-3.5 h-3.5" />
								<span>Android (Chrome & Samsung Browser)</span>
							</div>
							<ol className="list-decimal list-inside space-y-1 text-zinc-300 leading-relaxed text-[11px]">
								<li>Chrome'un sağ üst köşesindeki <strong>üç nokta (⋮)</strong> menüsüne dokunun.</li>
								<li><strong>"Ana Ekrana Ekle"</strong> veya <strong>"Uygulamayı Yükle"</strong> seçeneğini seçin.</li>
								<li>Logolu kısayol doğrudan telefonunuzun uygulama çekmecesine ve ana ekranına eklenecektir.</li>
							</ol>
						</div>
					</div>
				)}

				{/* Tab Content: Desktop */}
				{activeTab === 'desktop' && (
					<div className="mt-4 space-y-3.5 text-xs">
						<div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2.5">
							<div className="flex items-center justify-between">
								<span className="font-medium text-zinc-200">Windows Doğrudan Kısayol</span>
								<span className="text-[10px] text-zinc-400">Tek Tıkla İndir</span>
							</div>
							<p className="text-[11px] text-zinc-300 leading-relaxed">
								Masaüstünüze doğrudan kısayol dosyası indirin. Çift tıklayarak doğrudan bu panele ulaşabilirsiniz.
							</p>
							<button
								type="button"
								onClick={handleDownloadDesktopShortcut}
								className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-semibold transition-all shadow-md active:scale-98"
							>
								{downloaded ? (
									<>
										<Check className="w-4 h-4" />
										<span>Kısayol İndirildi!</span>
									</>
								) : (
									<>
										<Download className="w-4 h-4" />
										<span>Masaüstü Kısayolunu İndir (.url)</span>
									</>
								)}
							</button>
						</div>

						{/* Chrome / Edge Standalone App Install */}
						<div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2 text-[11px] text-zinc-300">
							<div className="flex items-center gap-2 font-medium text-cyan-300">
								<ExternalLink className="w-3.5 h-3.5" />
								<span>Tarayıcıdan Bağımsız Masaüstü Uygulaması Olarak Açma</span>
							</div>
							<p className="leading-relaxed">
								Chrome veya Microsoft Edge adres çubuğunun sağ tarafındaki <strong>"Yükle" (⊕)</strong> simgesine tıklayarak bu paneli tarayıcı sekmeleri olmadan tam ekran bağımsız bir Windows/Mac masaüstü uygulaması olarak çalıştırabilirsiniz.
							</p>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
