import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
 title: 'Beyond.Trades | Trade with precision. Build beyond the charts.',
 description: 'Trading intelligence, journaling, risk management, verified trade history and trader career development.'
};
export default function RootLayout({children}:{children:React.ReactNode}) {
 return <html lang="en"><body>{children}</body></html>;
}
