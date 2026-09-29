const configuredSiteUrl = process.env.SITE_URL?.trim();

if (!configuredSiteUrl) {
  throw new Error("Brak wymaganej zmiennej SITE_URL.");
}

const parsedSiteUrl = new URL(configuredSiteUrl);

if (
  !["http:", "https:"].includes(parsedSiteUrl.protocol) ||
  parsedSiteUrl.pathname !== "/" ||
  parsedSiteUrl.search ||
  parsedSiteUrl.hash ||
  parsedSiteUrl.username ||
  parsedSiteUrl.password
) {
  throw new Error("SITE_URL musi być adresem głównym strony HTTP lub HTTPS.");
}

export const siteUrl = parsedSiteUrl.origin;
