export const STORE_FEATURES = {
  POS_IN_HOUSE: "POS_IN_HOUSE",
  POS_PICKUP: "POS_PICKUP",
  POS_DELIVERY: "POS_DELIVERY",
  INVENTORY: "INVENTORY",
  CHATBOT: "CHATBOT",
  WEBSITE: "WEBSITE",
  SMS: "SMS",
  FOODPANDA: "FOODPANDA",
  PANDAGO: "PANDAGO",
  LOYALTY_PROGRAM: "LOYALTY_PROGRAM",
} as const;
export const storeFeatures = Object.values(STORE_FEATURES);
export type TStoreFeature = (typeof storeFeatures)[number];

export const ADDRESS_TITLES = {
  HOME: "HOME" as const,
  OFFICE: "OFFICE" as const,
  OTHERS: "OTHERS" as const,
};

export const addressTitles = Object.values(ADDRESS_TITLES);
export type TAddressTitles = (typeof addressTitles)[number];

export const STORE_MODELS = {
  SHOP: "shop" as const,
  RESTAURANT: "restaurant" as const,
};
export const storeModels = Object.values(STORE_MODELS);
export type TStoreModel = (typeof storeModels)[number];

export const ITEMS_TYPE = {
  FOOD: "food" as const,
  UNKNOWN: "unknown" as const,
};
export const itemsTypes = Object.values(ITEMS_TYPE);
export type TItemsType = (typeof itemsTypes)[number];

export const STORE_OPERATION_MODES = {
  QUICK: "quick" as const,
  TABLE: "table" as const,
  OTHERS: "others" as const,
};
export const storeOperationModes = Object.values(STORE_OPERATION_MODES);
export type TStoreOperationMode = (typeof storeOperationModes)[number];

export const PRODUCTS_STOCK_TYPE = {
  LIMITED: "limited" as const,
  UNLIMITED: "unlimited" as const,
};

export const productsStockTypes = Object.values(PRODUCTS_STOCK_TYPE);
export type TProductsStockType = (typeof productsStockTypes)[number];

// payments

// cards
export const PAYMENT_CARDS = {
  VISA: "visa" as const,
  MASTERCARD: "mastercard" as const,
  AMEX: "amex" as const,
  NEXUS: "nexus" as const,
  UNION_PAY: "union_pay" as const,
};

export const paymentCards = Object.values(PAYMENT_CARDS);
export type TPaymentCard = (typeof paymentCards)[number];

// wallets
export const MOBILE_WALLETS = {
  BKASH: "bkash" as const,
  NAGAD: "nagad" as const,
  ROCKET: "rocket" as const,
  UPAY: "upay" as const,
};

export const mobileWallets = Object.values(MOBILE_WALLETS);
export type TMobileWallet = (typeof mobileWallets)[number];

export const MOBILE_WALLETS_TYPE = {
  PERSONAL: "personal" as const,
  MERCHANT: "merchant" as const,
};

export const mobileWalletTypes = Object.values(MOBILE_WALLETS_TYPE);
export type TMobileWalletType = (typeof mobileWalletTypes)[number];

// payment gateways
export const PAYMENT_GATEWAYS = {
  SSL_COMMERZ: "ssl_commerz" as const,
  PORT_WALLET: "port_wallet" as const,
  SHURJO_PAY: "shurjo_pay" as const,
  BKASH: "bKash" as const,
  AAMAR_PAY: "aamar_pay" as const,
};

export const paymentGateways = Object.values(PAYMENT_GATEWAYS);
export type TPaymentGateway = (typeof paymentGateways)[number];

export const PAYMENT_METHODS = {
  CASH: "cash" as const,
  CARD: "card" as const,
  MOBILE_WALLET: "mobile_wallet" as const,
  PAYMENT_GATEWAY: "payment_gateway" as const,
  CUSTOM: "custom" as const,
};

export const paymentMethods = Object.values(PAYMENT_METHODS);
export type TPaymentMethod = (typeof paymentMethods)[number];

// order channel types
export const ORDER_BASE_CHANNEL_TYPES = {
  ONLINE: "online" as const,
  POS: "pos" as const,
};

export const orderBaseChannelTypes = Object.values(ORDER_BASE_CHANNEL_TYPES);
export type TOrderBaseChannelType = (typeof orderBaseChannelTypes)[number];

// order channel types
export const ORDER_CHANNEL_TYPES = {
  ...ORDER_BASE_CHANNEL_TYPES,
  FOODPANDA: "foodpanda" as const,
  FOODIE: "foodie" as const,
};

export const orderChannelTypes = Object.values(ORDER_CHANNEL_TYPES);
export type TOrderChannelType = (typeof orderChannelTypes)[number];

// order sub channel types
export const ORDER_SUB_CHANNEL_TYPES = {
  FACEBOOK: "facebook" as const,
  POS: "pos" as const,
  LINK: "link" as const,
  API: "api" as const,
};

export const orderSubChannelTypes = Object.values(ORDER_SUB_CHANNEL_TYPES);
export type TOrderSubChannelType = (typeof orderSubChannelTypes)[number];

// services
export const ORDER_SERVICE_TYPES = {
  IN_HOUSE: "inHouse" as const,
  PICKUP: "pickup" as const,
  DELIVERY: "delivery" as const,
};

export const orderServiceTypes = Object.values(ORDER_SERVICE_TYPES);
export type TOrderServiceType = (typeof orderServiceTypes)[number];

export const DELIVERY_SYSTEM_TYPES = {
  PERSONAL: "personal" as const,
  PANDAGO: "pandago" as const,
};
export const deliverySystemTypes = Object.values(DELIVERY_SYSTEM_TYPES);
export type TDeliverySystemType = (typeof deliverySystemTypes)[number];

// order schedules
export const ORDER_SCHEDULE_TYPES = {
  CURRENT: "current" as const,
  PRE_ORDER: "preOrder" as const,
  FLEXIBLE: "flexible" as const,
  SCHEDULED: "scheduled" as const,
};

export const orderScheduleTypes = Object.values(ORDER_SCHEDULE_TYPES);
export type TOrderScheduleType = (typeof orderScheduleTypes)[number];

// order sources
export const ORDER_SOURCE_TYPES = {
  USER: "user",
  ORDER_ADMIN: "orderAdmin",
  PROFILE: "profile",
} as const;

export type OrderSourceTypeShape = typeof ORDER_SOURCE_TYPES;

export const orderSourceTypes = Object.values(ORDER_SOURCE_TYPES);
export type TOrderSourceType = OrderSourceTypeShape[keyof OrderSourceTypeShape];

// order sources from store
export type TOrderSourceFromStore = Pick<
  OrderSourceTypeShape,
  "USER" | "ORDER_ADMIN"
>[keyof Pick<OrderSourceTypeShape, "USER" | "ORDER_ADMIN">];

export const orderSourceTypesFromStore = orderSourceTypes.filter(
  (source) => source !== ORDER_SOURCE_TYPES.PROFILE,
);

// report groups
export const REPORT_TIME_GROUPS = {
  HOURLY: "hourly" as const,
  DAILY: "daily" as const,
  WEEKLY: "weekly" as const,
  MONTHLY: "monthly" as const,
  YEARLY: "yearly" as const,
};

export const reportTimeGroups = Object.values(REPORT_TIME_GROUPS);
export type TReportTimeGroup = (typeof reportTimeGroups)[number];

// store access types
export const STORE_ACCESS_TYPES = {
  CREATOR: "creator" as const,
  ADMIN: "admin" as const,
  EDITOR: "editor" as const,
};
export const storeAccessTypes = Object.values(STORE_ACCESS_TYPES);
export type TStoreAccessType = (typeof storeAccessTypes)[number];

// store warning types
export const STORE_WARNING_TYPES = {
  FACEBOOK: "facebook" as const,
};
export const storeWarningTypes = Object.values(STORE_WARNING_TYPES);
export type TStoreWarningTypes = (typeof storeWarningTypes)[number];

// store order admin types
export const STORE_ORDER_ADMIN_TYPES = {
  MANAGER: "manager" as const,
  WAITER: "waiter" as const,
};
export const storeOrderAdminTypes = Object.values(STORE_ORDER_ADMIN_TYPES);
export type TStoreOrderAdminTypes = (typeof storeOrderAdminTypes)[number];

// store API Key use cases
export const STORE_API_KEY_USE_CASES = {
  WEBSITE: "website" as const,
  APP_ANDROID: "app_android" as const,
  APP_IOS: "app_ios" as const,
};
export const storeApiKeyUseCases = Object.values(STORE_API_KEY_USE_CASES);
export type TStoreApiKeyUseCases = (typeof storeApiKeyUseCases)[number];

// grouping types for product list apis
export const PRODUCT_GROUPING_TYPES = {
  CATEGORIZED: "categorized" as const,
};
export const productGroupingTypes = Object.values(PRODUCT_GROUPING_TYPES);
export type TProductGroupingTypes = (typeof productGroupingTypes)[number];

export const RECAPTCHA_ACTIONS = {
  USER_SIGNUP: "USER_SIGNUP",
  USER_LOGIN: "USER_LOGIN",
  USER_RESET: "USER_RESET",
  USER_UPDATE: "USER_UPDATE",
};

export const LOCKING_REASONS = {
  PENDING_BILLS: "PENDING_BILLS" as const,
  POS_ABUSE: "POS_ABUSE" as const,
};

export const lockingReasons = Object.values(LOCKING_REASONS);
export type TLockingReason = (typeof lockingReasons)[number];

// STORE REFERENCE TYPES
export const STORE_REFERENCE_TYPES = {
  FRIENDS_AND_FAMILY: "friends_and_family" as const,
  OTHER_BUSINESSES: "other_businesses" as const,
  FACEBOOK: "facebook" as const,
  SOCIAL_MEDIA: "social_media" as const,
  GOOGLE: "google" as const,
  AI_SEARCH: "ai_search" as const,
  OTHERS: "others" as const,
};

export const storeReferenceTypes = Object.values(STORE_REFERENCE_TYPES);
export type TStoreReferenceType = (typeof storeReferenceTypes)[number];

// Source types
export const ADMIN_SOURCE_TYPES = {
  ADMIN: "admin" as const,
  USER: "user" as const,
};

export const adminSourceTypes = Object.values(ADMIN_SOURCE_TYPES);
export type TAdminSourceTypes = (typeof adminSourceTypes)[number];
