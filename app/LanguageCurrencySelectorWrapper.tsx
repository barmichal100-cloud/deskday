import { getUser } from "@/lib/getUser";
import LanguageCurrencySelector from "./LanguageCurrencySelector";

export default async function LanguageCurrencySelectorWrapper() {
  const user = await getUser();

  // Default to EN if no user is logged in
  const currentLocale = user?.preferredLocale || "EN";

  return <LanguageCurrencySelector currentLocale={currentLocale} />;
}
