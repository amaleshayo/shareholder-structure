import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Shareholder, SberResponse, SberRow } from '../types';
import DonutChart from './DonutChart';
import '../styles/shareholder.scss';
import '../apiMock';

function parseRows(rows: SberRow[]): Shareholder[] {
    const seen = new Map<string, number>();
    for (const r of rows) {
        const name = r.holder.trim();
        const p = parseFloat((r.share_percent || '0').replace(',', '.'));
        if (!seen.has(name)) seen.set(name, p);
    }
    const arr: Shareholder[] = Array.from(seen, ([name, percent], i) => ({
        id: String(i + 1),
        name,
        percent,
    }));

    const sum = arr.reduce((s, x) => s + x.percent, 0);
    if (Math.abs(sum - 100) < 1e-6)
        return arr.map((x) => ({ ...x, percent: Number(x.percent.toFixed(2)) }));

    const scaled = arr.map((x) => ({ ...x, percent: (x.percent / sum) * 100 }));
    const rounded = scaled.map((x) => ({ ...x, percent: Number(x.percent.toFixed(2)) }));
    let diff = Number((100 - rounded.reduce((s, x) => s + x.percent, 0)).toFixed(2));

    if (Math.abs(diff) >= 0.01) {
        const step = diff > 0 ? 0.01 : -0.01;
        const ordered = [...rounded].sort((a, b) => b.percent - a.percent);
        let i = 0;
        while (Math.abs(diff) >= 0.01) {
            ordered[i % ordered.length].percent = Number(
                (ordered[i % ordered.length].percent + step).toFixed(2)
            );
            diff = Number((diff - step).toFixed(2));
            i++;
        }
        const fix = new Map(ordered.map((x) => [x.name, x.percent] as const));
        return rounded.map((x) => ({ ...x, percent: fix.get(x.name)! }));
    }
    return rounded;
}

export default function ShareholderStructure() {
    const [rows, setRows] = useState<Shareholder[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await axios.get<SberResponse>('/api/shareholders');
                setRows(parseRows(res.data.SBER));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const columns = useMemo<ColumnsType<Shareholder>>(
        () => [
            {
                title: 'Держатель акции',
                dataIndex: 'name',
                key: 'name',
                className: 'col-holder',
                width: 460,
            },
            {
                title: '% Доли',
                dataIndex: 'percent',
                key: 'percent',
                className: 'col-percent',
                width: 274,
                align: 'right',
                render: (v: number) => `${v.toFixed(2)} %`,
            },
        ],
        []
    );

    return (
        <div className="shareholder-card">
            <div className="shareholder-title">Структура акционеров</div>

            <div className="shareholder-grid">
                <div className="shareholder-table">
                    <Table
                        tableLayout="fixed"
                        rowKey={(r) => r.id}
                        loading={loading}
                        columns={columns}
                        dataSource={rows}
                        pagination={false}
                        bordered={false}
                    />
                    <div className="updatedAt">
                        Дата последнего обновления этой структуры: {dayjs().format('DD.MM.YYYY')}
                    </div>
                </div>

                <div className="chart-card">
                    <DonutChart data={rows} withCard={false} />
                </div>
            </div>
        </div>
    );
}
