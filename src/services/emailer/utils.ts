import moment from "moment";
import config from "../../settings/config";

// type of email source
export type TEmailSource = "main" | "no_reply";

// template lists
export const REGULAR_TEMPLATES = {
  welcome: "job_portal_welcome" as const,
  verification_code: "job_portal_verification_code" as const,
  sms_low_balance: "job_portal_sms_low_balance" as const,
};

// template data
export const BASIC_TEMPLATE_DATA = () => ({
  website_link: `${config.SITE_URL}`,
  dashboard_link: `${config.ADMIN_DASHBOARD_URL}`,
  orders_dashboard_link: `${config.ORDERS_DASHBOARD_URL}`,
  office_address: "68/8 B, Jigatola, Dhanmondi 1209",
  logo_horizontal_small_link: `${config.SITE_URL}/images/logos/logo-horizontal-small.png`,
  logo_horizontal_medium_link: `${config.SITE_URL}/images/logos/logo-horizontal-medium.png`,
  logo_vertical_small_link: `${config.SITE_URL}/images/logos/logo-vertical-small.png`,
  logo_vertical_medium_link: `${config.SITE_URL}/images/logos/logo-vertical-medium.png`,
  logo_vertical_transparent_background: `${config.SITE_URL}/images/logos/logo-vertical.png`,
  logo_no_text_small_link: `${config.SITE_URL}/images/logos/logo-no-text-small.png`,
  logo_no_text_medium_link: `${config.SITE_URL}/images/logos/logo-no-text-medium.png`,
  current_year: moment().year(),
  guides_link: `${config.SITE_URL}/guides`,
  blog_link: `${config.SITE_URL}/blog`,
  contacts_link: `${config.SITE_URL}#contacts`,
  office_map_link: "",
});

export const USER_TEMPLATE_DATA = (subscriptionId?: string, name?: string) => ({
  subscriber_name: name || "",
  unsubscribe_link: subscriptionId
    ? `${config.SITE_URL}/emails/unsubscribe/${subscriptionId}`
    : "",
});

// template name generation
export function generateEmailTemplateName(templateName: string) {
  return `job_portal_${templateName.toLowerCase().replace(/ /g, "_")}`;
}
