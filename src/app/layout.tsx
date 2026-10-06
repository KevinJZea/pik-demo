import type { Metadata } from 'next';
import { Fraunces, Instrument_Sans } from 'next/font/google';

import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PIK — Reservas para salones, barberías, spas y estudios de uñas',
  description:
    'Reserva y paga en línea una cita en tu salón, barbería, spa o estudio de uñas. Registra tu negocio y empieza a recibir reservas en minutos.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${instrumentSans.variable}`}
    >
      <body className="min-h-full flex flex-col bg-cream font-sans text-espresso antialiased">
        {children}
      </body>
    </html>
  );
}
