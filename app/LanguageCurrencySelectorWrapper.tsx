import { getUser } from "@/lib/getUser";
import LanguageCurrencySelector from "./LanguageCurrencySelector";

export default async function LanguageCurrencySelectorWrapper() {
  const user = await getUser();

  // Default to EN and ILS if no user is logged in
  const currentLocale = user?.preferredLocale || "EN";
  const currentCurrency = user?.preferredCurrency || "ILS";

  return <LanguageCurrencySelector currentLocale={currentLocale} currentCurrency={currentCurrency} />;
}
