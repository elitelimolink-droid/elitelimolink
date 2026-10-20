import {
	data,
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from 'react-router';
import type { Route } from './+types/root';
import stylesheet from '@/index.css?url';
import { siteOrigin } from '@/lib/site-origin.server';
import { HorizonsPreviewScripts } from './horizons-preview-scripts';

export const links: Route.LinksFunction = () => [
	{ rel: 'stylesheet', href: stylesheet },
	{ rel: 'stylesheet', href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css' },
	{ rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
	{ rel: 'manifest', href: '/manifest.json' },
	{ rel: 'apple-touch-icon', href: '/icons/booking-icon.jpg' },
	{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
	{
		rel: 'preconnect',
		href: 'https://fonts.gstatic.com',
		crossOrigin: 'anonymous',
	},
];

/**
 * Publishes the site's public origin, which `seo()` reads to build canonical and
 * `og:url` tags, and advertises the sitemap to crawlers that read response
 * headers rather than HTML.
 *
 * A `meta` export can only reach server data through `matches`, and the `headers`
 * export cannot see loader data at all, so both have to travel this way.
 */
export function loader({ request }: Route.LoaderArgs) {
	const origin = siteOrigin(request);

	return data(
		{ origin },
		{ headers: { Link: `<${origin}/sitemap.xml>; rel="sitemap"; type="application/xml"` } },
	);
}

/**
 * A page route that exports `headers` replaces this one, so merge `parentHeaders`
 * there rather than returning only that route's own headers.
 */
export function headers({ loaderHeaders }: Route.HeadersArgs) {
	return loaderHeaders;
}

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="theme-color" content="#000000" />
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
				<meta name="apple-mobile-web-app-title" content="BookNowLux" />
				<meta name="application-name" content="BookNowLux" />
				{/* Apply the saved day/night theme before paint to avoid a flash.
						Respects the device preference when no choice is saved. */}
				<script
					dangerouslySetInnerHTML={{
						__html:
							"(function(){try{var K='theme';var s=localStorage.getItem(K);var mode=(s==='light'||s==='dark')?s:'auto';var root=document.documentElement;root.setAttribute('data-theme-mode',mode);var mq=window.matchMedia('(prefers-color-scheme: dark)');function isDark(){return mode==='auto'?mq.matches:mode==='dark';}root.classList.toggle('dark',isDark());mq.addEventListener('change',function(){var m=root.getAttribute('data-theme-mode')||'auto';if(m==='auto'){root.classList.toggle('dark',mq.matches);}});}catch(e){}})();",
					}}
				/>
				{/* Dynamic mobile icon and manifest matching active panel for iOS & Android shortcuts */}
				<script
					dangerouslySetInnerHTML={{
						__html:
							"(function(){try{var p=window.location.pathname||'';var d=p.indexOf('/driver')===0;var o=p.indexOf('/dashboard')===0||p.indexOf('/dispatch')===0;var icon=d?'/icons/driver-icon.jpg':o?'/icons/operator-icon.jpg':'/icons/booking-icon.jpg';var m=d?'/manifest-driver.json':o?'/manifest-operator.json':'/manifest.json';var title=d?'BookNowLux Driver':o?'BookNowLux Dispatch':'BookNowLux VIP';var al=document.querySelector('link[rel=\"apple-touch-icon\"]');if(al)al.href=icon;var ml=document.querySelector('link[rel=\"manifest\"]');if(ml)ml.href=m;var at=document.querySelector('meta[name=\"apple-mobile-web-app-title\"]');if(at)at.content=title;}catch(e){}})();",
					}}
				/>
				<Meta />
				<Links />
				<HorizonsPreviewScripts />
			</head>
			<body>
				<div id="root">{children}</div>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = 'Oops!';
	let details = 'An unexpected error occurred.';
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? '404' : 'Error';
		details =
			error.status === 404
				? 'The requested page could not be found.'
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main>
			<h1>{message}</h1>
			<p>{details}</p>
			{stack ? (
				<pre>
					<code>{stack}</code>
				</pre>
			) : null}
		</main>
	);
}
