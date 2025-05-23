export const _formatDate = (_date: number) => {
    const date = new Date(_date);
    const hrs = date.getHours();
    const meridian = hrs >= 12 ? "PM" : "AM";
    const mins = date.getMinutes();
    return `${hrs > 12 ? hrs % 12 : hrs}:${mins > 9 ? mins : `0${mins}`} ${meridian}`;
};
