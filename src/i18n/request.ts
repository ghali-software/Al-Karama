import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import fr from "../messages/fr.json";
import ar from "../messages/ar.json";

const allMessages = { fr, ar } as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale =
    requested === "ar" || requested === "fr" ? requested : routing.defaultLocale;

  return {
    locale,
    messages: allMessages[locale as keyof typeof allMessages],
  };
});
