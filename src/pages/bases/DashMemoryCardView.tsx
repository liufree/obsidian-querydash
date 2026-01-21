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
		
		// 重新排序卡片
		this.sortAndFilterCards(allCards);
		
		// 找到第一个需要复习的卡片
		this.findFirstCardToReview();
		
		// 渲染卡片
		this.renderMemoryCard();
	}
	
	private sortAndFilterCards(allCards: any[]) {
		// 按 sr-due 升序排序
		this.sortedCards = [...allCards]
			.map(function (card) {
				const dueValue = card.getValue('note.sr-due');
				// Convert Value to string for dayjs
				const dueString = dueValue?.toString() || '';
				return {card, due: dueString};
			})
			.sort((a, b) => {
				if (!a.due && !b.due) return 0;
				if (!a.due) return 1;
				if (!b.due) return -1;
				return dayjs(a.due).isSameOrBefore(b.due) ? -1 : 1;
			})
			.map(item => item.card);
	}
	
	private findFirstCardToReview() {
		const now = dayjs();
		let idx = 0;
		
		// 找到第一个到期日期在今天或之前的卡片
		for (let i = 0; i < this.sortedCards.length; i++) {
			const due = this.sortedCards[i].getValue('note.sr-due');
			const dueString = due?.toString() || '';
			if (dueString && dayjs(dueString).isSameOrBefore(now, 'day')) {
				idx = i;
				break;
			}
		}
		
		this.currentIndex = idx;
		
		// 如果没有找到需要复习的卡片，显示完成消息
		if (this.sortedCards.length > 0) {
			const due = this.sortedCards[idx].getValue('note.sr-due');
			const dueString = due?.toString() || '';
			if (!dueString || !dayjs(dueString).isSameOrBefore(now, 'day')) {
				// 所有卡片的到期日期都在未来
				this.currentIndex = -1;
			}
		}
	}

	private async renderMemoryCard() {
		// 检查是否有需要复习的卡片
		if (this.currentIndex === -1 || !this.sortedCards[this.currentIndex]) {
			this.containerEl.empty();
			const completeDiv = this.containerEl.createDiv({
				text: '🎉 恭喜！所有卡片都已复习完成！',
				cls: 'memory-card-complete'
			});
			completeDiv.style.cssText = `
				display: flex;
				align-items: center;
				justify-content: center;
				height: 100%;
				font-size: 24px;
				font-weight: bold;
				color: #52c41a;
				text-align: center;
				padding: 40px;
			`;
			return;
		}
		
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
		
		// 计算是否有前一个/后一个需要复习的卡片
		const now = dayjs();
		let hasPrevCard = false;
		let hasNextCard = false;
		
		// 检查前一个需要复习的卡片
		for (let i = this.currentIndex - 1; i >= 0; i--) {
			const due = this.sortedCards[i].getValue('note.sr-due');
			const dueString = due?.toString() || '';
			if (dueString && dayjs(dueString).isSameOrBefore(now, 'day')) {
				hasPrevCard = true;
				break;
			}
		}
		
		// 检查后一个需要复习的卡片
		for (let i = this.currentIndex + 1; i < this.sortedCards.length; i++) {
			const due = this.sortedCards[i].getValue('note.sr-due');
			const dueString = due?.toString() || '';
			if (dueString && dayjs(dueString).isSameOrBefore(now, 'day')) {
				hasNextCard = true;
				break;
			}
		}
		
		root.render(
			<MemoryCard
				markdown={markdownStr}
				app={this.app}
				filePath={filePathStr}
				title={title}
				frontmatter={frontmatter}
				onPrev={this.handlePrev}
				onNext={this.handleNext}
				isPrevDisabled={!hasPrevCard}
				isNextDisabled={!hasNextCard}
			/>
		);
	}

	private handlePrev = () => {
		// 查找前一个需要复习的卡片
		this.findPrevCardToReview();
	};
	
	private findPrevCardToReview() {
		const now = dayjs();
		let prevIndex = -1;
		
		// 从当前索引-1开始向前查找
		for (let i = this.currentIndex - 1; i >= 0; i--) {
			const due = this.sortedCards[i].getValue('note.sr-due');
			const dueString = due?.toString() || '';
			if (dueString && dayjs(dueString).isSameOrBefore(now, 'day')) {
				prevIndex = i;
				break;
			}
		}
		
		// 如果前面没有找到，从末尾开始查找
		if (prevIndex === -1) {
			for (let i = this.sortedCards.length - 1; i >= 0; i--) {
				const due = this.sortedCards[i].getValue('note.sr-due');
				const dueString = due?.toString() || '';
				if (dueString && dayjs(dueString).isSameOrBefore(now, 'day')) {
					prevIndex = i;
					break;
				}
			}
		}
		
		// 更新当前索引并重新渲染
		if (prevIndex !== -1 && prevIndex !== this.currentIndex) {
			this.currentIndex = prevIndex;
			this.containerEl.empty();
			this.renderMemoryCard();
		}
	}

	private handleNext = () => {
		// 重新计算需要复习的卡片
		this.findNextCardToReview();
	};
	
	private findNextCardToReview() {
		const now = dayjs();
		let nextIndex = -1;
		
		// 从当前索引+1开始查找
		for (let i = this.currentIndex + 1; i < this.sortedCards.length; i++) {
			const due = this.sortedCards[i].getValue('note.sr-due');
			const dueString = due?.toString() || '';
			if (dueString && dayjs(dueString).isSameOrBefore(now, 'day')) {
				nextIndex = i;
				break;
			}
		}
		
		// 如果后面没有找到，从头开始查找
		if (nextIndex === -1) {
			for (let i = 0; i < this.sortedCards.length; i++) {
				const due = this.sortedCards[i].getValue('note.sr-due');
				const dueString = due?.toString() || '';
				if (dueString && dayjs(dueString).isSameOrBefore(now, 'day')) {
					nextIndex = i;
					break;
				}
			}
		}
		
		// 更新当前索引并重新渲染
		if (nextIndex !== -1 && nextIndex !== this.currentIndex) {
			this.currentIndex = nextIndex;
			this.containerEl.empty();
			this.renderMemoryCard();
		} else {
			// 没有更多需要复习的卡片
			this.containerEl.empty();
			const completeDiv = this.containerEl.createDiv({
				text: '🎉 恭喜！所有卡片都已复习完成！',
				cls: 'memory-card-complete'
			});
			completeDiv.style.cssText = `
				display: flex;
				align-items: center;
				justify-content: center;
				height: 100%;
				font-size: 24px;
				font-weight: bold;
				color: #52c41a;
				text-align: center;
				padding: 40px;
			`;
		}
	}
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
	
	// 获取当前值
	let repetitions = Number(frontmatter?.['sr-repetitions']) || 0;
	let interval = Number(frontmatter?.['sr-interval']) || 0;
	let ease = Number(frontmatter?.['sr-ease']) || 2.5;
	let lapses = Number(frontmatter?.['sr-lapses']) || 0;

	// 基于SM-2算法的改进版本
	if (rating < 3) {
		// 回答错误或困难：重置间隔，增加遗忘次数
		lapses += 1;
		repetitions = 0;
		interval = 1;
		// 降低易度因子，但不要低于1.3
		ease = Math.max(1.3, ease - 0.2);
	} else {
		// 回答正确
		if (repetitions === 0) {
			// 第一次复习
			interval = 1;
		} else if (repetitions === 1) {
			// 第二次复习
			interval = 6;
		} else {
			// 后续复习：使用当前间隔乘以易度因子
			interval = Math.round(interval * ease);
		}
		
		// 更新易度因子
		// 公式：新易度 = 旧易度 + (0.1 - (5 - 评分) * (0.08 + (5 - 评分) * 0.02))
		ease = ease + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02);
		ease = Math.max(1.3, Number(ease.toFixed(2)));
		
		// 增加复习次数
		repetitions += 1;
	}

	// 计算下次复习日期
	const due = dayjs().add(interval, 'day');
	
	// 如果间隔超过1年，标记为已掌握
	if (interval >= 365) {
		return true;
	}
	
	// 更新frontmatter
	await app.fileManager.processFrontMatter(file, (fm: Record<string, any>) => {
		fm['sr-repetitions'] = repetitions;
		fm['sr-interval'] = interval;
		fm['sr-ease'] = ease;
		fm['sr-due'] = due.format('YYYY-MM-DD');
		fm['sr-lapses'] = lapses;
	});
	
	// 触发刷新
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
			try {
				// 使用renderMarkdown方法渲染markdown
				// 这个方法更适合在React组件中使用
				MarkdownRenderer.renderMarkdown(
					markdown,
					mdRef.current,
					filePath,
					null as any
				);
				setRendered(true);
			} catch (error) {
				console.error('Error rendering markdown:', error);
				// 如果渲染失败，直接显示原始markdown
				if (mdRef.current) {
					mdRef.current.innerHTML = markdown;
				}
			}
		}
	}, [markdown, app, filePath]);

	const refresh = async () => {
		// 刷新数据：重新获取卡片数据并重新渲染
		// 这个函数会被updateSRFrontmatter调用
		// 在实际实现中，这里应该触发父组件重新加载数据
		// 目前我们先留空，因为数据更新已经在updateSRFrontmatter中处理了
	};

	const handleDifficulty = async (action: 'hard' | 'medium' | 'easy') => {
		let rating: 1 | 3 | 5 = 3;
		if (action === 'hard') rating = 1;
		else if (action === 'medium') rating = 3;
		else if (action === 'easy') rating = 5;
		const isDueOverYear = await updateSRFrontmatter(app, filePath, fm, rating, refresh);
		if (isDueOverYear) {
			setShowModal(true);
		}
		// 评分后自动跳转到下一个卡片
		onNext();
	};

	return (
		<>
			<Card style={{margin: '80px auto', padding: 24, marginBottom: 100}}>
				<div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
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
					<Button
						style={{marginRight: 30}}
						onClick={onPrev}
						disabled={isPrevDisabled}
						type="default"
					>
						prev
					</Button>
					<Button type="primary" danger onClick={() => handleDifficulty('hard')}>
						hard
					</Button>
					<Button
						type="default"
						style={{backgroundColor: '#87CEEB', color: '#000'}} // SkyBlue for medium
						onClick={() => handleDifficulty('medium')}
					>
						medium
					</Button>
					<Button
						type="primary"
						style={{backgroundColor: '#98FB98', color: '#000'}} // PaleGreen for easy
						onClick={() => handleDifficulty('easy')}
					>
						easy
					</Button>
					<Button
						style={{marginLeft: 30}}
						onClick={onNext}
						disabled={isNextDisabled}
						type="default"
					>
						next
					</Button>
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
