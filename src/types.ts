export type Shareholder = {
    id: string;
    name: string;
    percent: number;
    color?: string;
};

export type SberRow = {
    holder: string;
    share_percent: string;
};

export type SberResponse = {
    SBER: SberRow[];
};
