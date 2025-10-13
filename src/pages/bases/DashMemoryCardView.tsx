import {BasesView, MarkdownRenderer, QueryController, TFile} from 'obsidian';
import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Button, Space, Card, Modal, notification} from 'antd';
import dayjs from 'dayjs';

export const MemoryCardViewType = 'dash-memory-card-view';

export class DashMemoryCardView extends BasesView {
	readonly type = MemoryCardViewType;
	private containerEl: HTMLElement;

	constructor(controller: QueryController, parentEl: HTMLElement) {
		super(controller);
		this.containerEl = parentEl.createDiv('memory-card-view-container');
	}

	public async onDataUpdated(): Promise<void> {
		this.containerEl.empty();
		const cardData = this.data.data[0];
		const filePath = cardData?.getValue('file.path');
		const filePathStr = typeof filePath === 'string' ? filePath : filePath?.toString() || '';
		let markdownStr = '';
		let title = '';
		let frontmatter: Record<string, any> | undefined = undefined;
		if (filePathStr) {
			const file = this.app.vault.getAbstractFileByPath(filePathStr);
			if (file instanceof TFile) {
				markdownStr = await this.app.vault.read(file);
				title = file.name.replace(/\.md$/, '');
				const cache = this.app.metadataCache.getFileCache(file);
				if (cache?.frontmatter) {
					frontmatter = cache.frontmatter;
				}
			}
		}
		const container = this.containerEl.createDiv();
		const root = createRoot(container);
		root.render(<MemoryCard markdown={markdownStr} app={this.app} filePath={filePathStr} title={title}
								frontmatter={frontmatter}/>);
	}
}

interface MemoryCardProps {
	markdown: string;
	app: any;
	filePath: string;
	title: string;
	frontmatter?: Record<string, any>;
}

const updateSRFrontmatter = async (
	app: any,
	filePath: string,
	frontmatter: Record<string, any> | undefined,
	rating: 1 | 3 | 5,
	refresh: () => void
) => {
	if (!filePath) return false;
	const file = app.vault.getAbstractFileByPath(filePath);
	if (!(file instanceof TFile)) return false;
	let repetitions = Number(frontmatter?.['sr-repetitions']) || 0;
	let interval = Number(frontmatter?.['sr-interval']) || 1;
	let ease = Number(frontmatter?.['sr-ease']) || 2.5;
	let lapses = Number(frontmatter?.['sr-lapses']) || 0;

	if (rating < 3) {
		repetitions = 0;
		lapses += 1;
		interval = 1;
		ease = Math.max(1.3, Number((ease - 0.2).toFixed(2)));
	} else {
		repetitions += 1;
		if (repetitions === 1) {
			interval = 1;
		} else if (repetitions === 2) {
			interval = 6;
		} else {
			interval = Math.round(interval * ease);
		}
		ease = ease + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02);
		ease = Math.max(1.3, Number(ease.toFixed(2)));
	}
	const due = dayjs().add(interval, 'day');
	const now = dayjs();
	if (due.diff(now, 'day') >= 365) {
		return true;
	}
	await app.fileManager.processFrontMatter(file, (fm: Record<string, any>) => {
		fm['sr-repetitions'] = repetitions;
		fm['sr-interval'] = interval;
		fm['sr-ease'] = ease;
		fm['sr-due'] = due.format('YYYY-MM-DD');
		fm['sr-lapses'] = lapses;
	});
	refresh();
	return false;
};

const MemoryCard: React.FC<MemoryCardProps> = ({markdown, app, filePath, title, frontmatter}) => {
	const mdRef = useRef<HTMLDivElement>(null);
	const [rendered, setRendered] = useState(false);
	const [fm, setFM] = useState(frontmatter);
	const [md, setMD] = useState(markdown);
	const [showModal, setShowModal] = useState(false);

	useEffect(() => {
		setFM(frontmatter);
		setMD(markdown);
	}, [frontmatter, markdown]);

	useEffect(() => {
		if (mdRef.current && !rendered) {
			MarkdownRenderer.render(
				app,
				md,
				mdRef.current,
				filePath,
				null
			);
			setRendered(true);
		}
	}, [md, app, filePath, rendered]);

	const refresh = async () => {
		const file = app.vault.getAbstractFileByPath(filePath);
		if (file instanceof TFile) {
			const newMD = await app.vault.read(file);
			setMD(newMD);
			const cache = app.metadataCache.getFileCache(file);
			setFM(cache?.frontmatter);
			setRendered(false);
		}
	};

	const handleDifficulty = async (action: 'hard' | 'medium' | 'easy') => {
		let rating: 1 | 3 | 5 = 3;
		if (action === 'hard') rating = 1;
		else if (action === 'medium') rating = 3;
		else if (action === 'easy') rating = 5;
		const isDueOverYear = await updateSRFrontmatter(app, filePath, fm, rating, refresh);
		if (isDueOverYear) setShowModal(true);
	};

	return (
		<>
			<Card style={{margin: '80px auto', padding: 24, marginBottom: 100}}>
				<h2 style={{textAlign: 'center', marginBottom: 16}}>{title}</h2>
				{fm && (
					<div style={{marginBottom: 16}}>
						<table style={{width: '100%', fontSize: 14, background: '#fafafa', borderRadius: 4}}>
							<tbody>
							{Object.entries(fm).map(([key, value]) => (
								<tr key={key}>
									<td style={{fontWeight: 'bold', padding: '2px 8px', width: 80}}>{key}</td>
									<td style={{padding: '2px 8px'}}>{String(value)}</td>
								</tr>
							))}
							</tbody>
						</table>
					</div>
				)}
				<div ref={mdRef} style={{overflowY: 'auto', marginBottom: 32}}/>
			</Card>
			<div style={{
				position: 'fixed',
				left: 0,
				right: 0,
				bottom: 0,
				zIndex: 100,
				background: 'rgba(255,255,255,0.97)',
				boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
				padding: '16px 0',
				display: 'flex',
				justifyContent: 'center',
			}}>
				<Space>
					<Button type="primary" danger onClick={() => handleDifficulty('hard')}>hard</Button>
					<Button type="default" onClick={() => handleDifficulty('medium')}>medium</Button>
					<Button type="primary" onClick={() => handleDifficulty('easy')}>easy</Button>
				</Space>
			</div>
			<Modal

				open={showModal}
				onCancel={() => setShowModal(false)}
				footer={null}
				centered
			>
				<div style={{textAlign: 'center', fontSize: 18, padding: '24px 0'}}>
					Congratulations! You have memorized this note.
				</div>
			</Modal>
		</>
	);
};
