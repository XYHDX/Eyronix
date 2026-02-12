export type Project = {
    id: string;
    title: string;
    description: string;
    image_url: string;
    stats: string[];
    status: 'Operational' | 'Completed' | 'In Progress';
    created_at?: string;
};

export type GovItem = {
    id: string;
    title: string;
    description: string;
    image_url: string;
    type: 'traffic' | 'security';
    features: string[];
    created_at?: string;
};
