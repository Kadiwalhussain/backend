import dayjs from "dayjs";

export const formatInr = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export const formatShortId = (id = "") => id.slice(-8).toUpperCase();

export const formatTimelineDate = (value) =>
  value ? dayjs(value).format("DD MMM YYYY, hh:mm A") : "-";
