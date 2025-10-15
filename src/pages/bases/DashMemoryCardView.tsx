import {BasesView, MarkdownRenderer, QueryController, TFile, Component} from 'obsidian';
import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Button, Space, Card, Modal, notification} from 'antd';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrBefore);

export const MemoryCardViewType = 'dash-memory-card-view';

export class DashMemoryCardView extends BasesView {
	readonly type = MemoryCardViewType;
	private containerEl: HTMLElement;
	private sortedCards: any[] = [];
	private currentIndex: number = 0;

	constructor(controller: QueryController, parentEl: HTMLElement) {
		super(controller);
		this.containerEl = parentEl.createDiv('memory-card-view-container');
	}

	public async onDataUpdated(): Promise<void> {
		this.containerEl.empty();
		const allCards = this.data.data;
		// 按 sr-due 升序排序
		this.sortedCards = [...allCards]
			.map(function (card) {
				return {card, due: card.getValue('note.sr-due')};
			})
			.sort((a, b) => {
				if (!a.due && !b.due) return 0;
				if (!a.due) return 1;
				if (!b.due) return -1;
				return dayjs(a.due).isSameOrBefore(b.due) ? -1 : 1;
			})
			.map(item => item.card);
		// 找到 sr-due 最近的卡片
		let idx = 0;
		const now = dayjs();
		for (let i = 0; i < this.sortedCards.length; i++) {
			const due = this.sortedCards[i].getValue('note.sr-due');
			if (due && dayjs(due).isSameOrBefore(now, 'day')) {
				idx = i;
				break;
			}
		}
		this.currentIndex = idx;
		this.renderMemoryCard();
	}

	private async renderMemoryCard() {
		const cardData = this.sortedCards[this.currentIndex];
		if (!cardData) return;
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
		root.render(
			<MemoryCard
				markdown={markdownStr}
				app={this.app}
				filePath={filePathStr}
				title={title}
				frontmatter={frontmatter}
				onPrev={this.handlePrev}
				onNext={this.handleNext}
				isPrevDisabled={this.currentIndex === 0}
				isNextDisabled={this.currentIndex === this.sortedCards.length - 1}
			/>
		);
	}

	private handlePrev = () => {
		if (this.currentIndex > 0) {
			this.currentIndex--;
			this.containerEl.empty();
			this.renderMemoryCard();
		}
	};

	private handleNext = () => {
		if (this.currentIndex < this.sortedCards.length - 1) {
			this.currentIndex++;
			this.containerEl.empty();
			this.renderMemoryCard();
		}
	};
}

interface MemoryCardProps {
	markdown: string;
	app: any;
	filePath: string;
	title: string;
	frontmatter?: Record<string, any>;
	onPrev: () => void;
	onNext: () => void;
	isPrevDisabled: boolean;
	isNextDisabled: boolean;
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

const MemoryCard: React.FC<MemoryCardProps> = ({
												   markdown,
												   app,
												   filePath,
												   title,
												   frontmatter,
												   onPrev,
												   onNext,
												   isPrevDisabled,
												   isNextDisabled
											   }) => {
	const mdRef = useRef<HTMLDivElement>(null);
	const [rendered, setRendered] = useState(false);
	const [fm, setFM] = useState(frontmatter);
	const [showModal, setShowModal] = useState(false);

	useEffect(() => {
		if (mdRef.current && !rendered) {
			// 修正：传递一个 Obsidian Component 实例，避免内存泄漏
			MarkdownRenderer.render(
				app,
				markdown,
				mdRef.current,
				filePath,
				null
			);
			setRendered(true);
		}
	}, [markdown, app, filePath]);

	const refresh = async () => {

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
				<div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
					<Button
						onClick={onPrev}
						disabled={isPrevDisabled}
						shape="circle"
						icon={<span style={{fontSize: 20}}>&larr;</span>}
						style={{marginRight: 32}}
					/>
					<div style={{flex: 1, maxWidth: 600}}>
						<h2 style={{textAlign: 'center', marginBottom: 16}}>{title}</h2>
						{frontmatter && (
							<div style={{marginBottom: 16}}>
								<table style={{width: '100%', fontSize: 14, background: '#fafafa', borderRadius: 4}}>
									<tbody>
									{Object.entries(frontmatter).map(([key, value]) => (
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
					</div>
					<Button
						onClick={onNext}
						disabled={isNextDisabled}
						shape="circle"
						icon={<span style={{fontSize: 20}}>&rarr;</span>}
						style={{marginLeft: 32}}
					/>
				</div>
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
