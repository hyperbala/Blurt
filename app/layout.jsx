import './globals.css';
import ClientProviders from './ClientProviders';
import {NextUIProvider} from "@nextui-org/react";
export const metadata = {
  title: 'Blurt',
  description: 'Communitcate',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
