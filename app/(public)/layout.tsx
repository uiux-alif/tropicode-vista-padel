import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { WhatsAppFab } from "@/components/public/WhatsAppFab";
import { getAllContent, getContent } from "@/lib/content";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = await getAllContent();
  const businessName = getContent(content, "global.businessName");

  return (
    <>
      <Navbar businessName={businessName} />
      <main className="min-h-screen pt-16 lg:pt-20">{children}</main>
      <Footer
        businessName={businessName}
        address={getContent(content, "global.address")}
        phone={getContent(content, "global.phone")}
        email={getContent(content, "global.email")}
        whatsapp={getContent(content, "global.whatsapp")}
        instagram={getContent(content, "global.instagram")}
        facebook={getContent(content, "global.facebook")}
        weekdayHours={getContent(content, "hours.weekday")}
        weekendHours={getContent(content, "hours.weekend")}
      />
      <WhatsAppFab number={getContent(content, "global.whatsapp")} />
    </>
  );
}
