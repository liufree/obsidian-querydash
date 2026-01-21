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
		console.log('DashMemoryCardView - onDataUpdated called');
		this.containerEl.empty();
		
		// 检查数据
		if (!this.data) {
			console.error('DashMemoryCardView - this.data is undefined');
			this.showNoDataMessage();
			return;
		}
		
		if (!this.data.data) {
			console.error('DashMemoryCardView - this.data.data is undefined');
			this.showNoDataMessage();
			return;
		}
		
		const allCards = this.data.data;
		console.log('DashMemoryCardView - total cards from data:', allCards.length);
		
		// 检查卡片数据结构
		if (allCards.length > 0) {
			const sampleCard = allCards[0];
			console.log('DashMemoryCardView - sample card:', {
				hasGetValue: typeof sampleCard.getValue === 'function',
				properties: Object.keys(sampleCard).filter(k => !k.startsWith('_')),
				getValueTypes: ['file.path' as any, 'note.sr-due' as any, 'file.name' as any].map(prop => ({
					prop,
					value: sampleCard.getValue(prop),
					type: typeof sampleCard.getValue(prop)
				}))
			});
		}
		
		// 重新排序卡片
		this.sortAndFilterCards(allCards);
		
		// 找到第一个需要复习的卡片
		await this.findFirstCardToReview();
		
		// 渲染卡片
		await this.renderMemoryCard();
	}
	
	private showNoDataMessage() {
		this.containerEl.empty();
		const messageDiv = this.containerEl.createDiv({
			text: '📭 没有找到卡片数据\n请确保已选择包含记忆卡片的数据库',
			cls: 'memory-card-no-data'
		});
		messageDiv.style.cssText = `
			display: flex;
			align-items: center;
			justify-content: center;
			height: 100%;
			font-size: 18px;
			color: #faad14;
			text-align: center;
			padding: 40px;
			line-height: 1.6;
			flex-direction: column;
			gap: 20px;
		`;
		
		// 添加帮助信息
		const helpDiv = this.containerEl.createDiv({
			text: '💡 提示：在Obsidian Bases中选择一个包含"note.sr-due"属性的数据库视图',
			cls: 'memory-card-help'
		});
		helpDiv.style.cssText = `
			font-size: 14px;
			color: #666;
			text-align: center;
			padding: 10px;
			background: #f6ffed;
			border-radius: 6px;
			margin-top: 10px;
			max-width: 600px;
			margin-left: auto;
			margin-right: auto;
		`;
	}
	
	private sortAndFilterCards(allCards: any[]) {
		// 按 sr-due 升序排序
		const now = dayjs();
		this.sortedCards = [...allCards]
			.map(function (card) {
				// 尝试不同的属性名来获取 sr-due
				let dueValue = null;
				let dueString = '';
				
				// 尝试可能的属性名
				const possiblePropNames = [
					'note.sr-due',
					'sr-due',
					'note.sr_due',
					'sr_due',
					'note.srDue',
					'srDue'
				];
				
				for (const propName of possiblePropNames) {
					try {
						const value = card.getValue(propName as any);
						if (value) {
							dueValue = value;
							dueString = value.toString();
							console.log(`DashMemoryCardView - 找到属性 ${propName}: ${dueString}`);
							break;
						}
					} catch (error) {
						// 忽略错误，继续尝试下一个属性名
					}
				}
				
				return {card, due: dueString};
			})
			.sort((a, b) => {
				if (!a.due && !b.due) return 0;
				if (!a.due) return -1;  // 新卡片（无到期日期）排在前面
				if (!b.due) return 1;   // 新卡片（无到期日期）排在前面
				return dayjs(a.due).isSameOrBefore(b.due) ? -1 : 1;
			})
			.map(item => item.card);
		
		// 调试信息：记录排序后的卡片状态
		console.log('DashMemoryCardView - sortAndFilterCards:', {
			totalCards: allCards.length,
			sortedCards: this.sortedCards.length,
			cardDetails: this.sortedCards.map((card, idx) => {
				// 检查卡片的所有可用属性
				const availableProps = [];
				const testProps = ['file.path', 'file.name', 'note.sr-due', 'sr-due', 'note.sr_due', 'sr_due'];
				
				for (const prop of testProps) {
					try {
						const value = card.getValue(prop as any);
						if (value !== undefined && value !== null) {
							availableProps.push(`${prop}: ${value}`);
						}
					} catch (error) {
						// 忽略错误
					}
				}
				
				return {
					index: idx,
					availableProps: availableProps,
					hasCard: !!card
				};
			})
		});
	}
	
	private async findFirstCardToReview() {
		// 获取所有卡片列表
		const allFileList = await this.getAllFileList();
		
		// 如果有卡片，使用第一个
		if (allFileList.length > 0) {
			this.currentIndex = 0; // 总是使用第一个卡片
			console.log(`DashMemoryCardView - 找到卡片: 索引=${this.currentIndex}, 标题=${allFileList[0].title}`);
		} else {
			this.currentIndex = -1;
			console.log('DashMemoryCardView - 没有卡片');
		}
		
		// 调试信息：记录找到的卡片状态
		console.log('DashMemoryCardView - findFirstCardToReview:', {
			totalCards: this.sortedCards.length,
			allCards: allFileList.length,
			currentIndex: this.currentIndex,
			hasCards: this.sortedCards.length > 0
		});
		
		// 如果没有卡片
		if (this.sortedCards.length === 0) {
			this.currentIndex = -1;
			console.log('DashMemoryCardView - 没有卡片数据');
		}
	}

	private async renderMemoryCard() {
		// 获取所有卡片列表（不筛选，显示所有卡片）
		const allFiles = await this.getAllFileList();
		
		// 如果没有卡片
		if (allFiles.length === 0) {
			this.containerEl.empty();
			const completeDiv = this.containerEl.createDiv({
				text: '📭 没有找到卡片数据',
				cls: 'memory-card-no-data'
			});
			completeDiv.style.cssText = `
				display: flex;
				align-items: center;
				justify-content: center;
				height: 100%;
				font-size: 24px;
				font-weight: bold;
				color: #faad14;
				text-align: center;
				padding: 40px;
			`;
			return;
		}
		
		// 如果当前索引无效，使用第一个卡片
		if (this.currentIndex === -1 || !this.sortedCards[this.currentIndex]) {
			this.currentIndex = 0;
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
		
		// 获取所有文件列表
		const allFileList = await this.getAllFileList();
		
		const container = this.containerEl.createDiv();
		const root = createRoot(container);
		
		// 计算是否有前一个/后一个卡片
		let hasPrevCard = this.currentIndex > 0;
		let hasNextCard = this.currentIndex < this.sortedCards.length - 1;
		
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
				fileList={allFiles}
				currentFileIndex={this.currentIndex}
				onFileSelect={this.handleFileSelect}
			/>
		);
	}
	
	private async getReviewFileList(): Promise<Array<{title: string, due: string, index: number, isNew: boolean}>> {
		const now = dayjs();
		const fileList: Array<{title: string, due: string, index: number, isNew: boolean}> = [];
		
		for (let i = 0; i < this.sortedCards.length; i++) {
			const card = this.sortedCards[i];
			const filePath = card?.getValue('file.path');
			const filePathStr = typeof filePath === 'string' ? filePath : filePath?.toString() || '';
			
			if (filePathStr) {
				const file = this.app.vault.getAbstractFileByPath(filePathStr);
				if (file instanceof TFile) {
					// 尝试获取到期日期
					let dueString = '';
					const possiblePropNames = [
						'note.sr-due',
						'sr-due',
						'note.sr_due',
						'sr_due',
						'note.srDue',
						'srDue'
					];
					
					for (const propName of possiblePropNames) {
						try {
							const value = card.getValue(propName as any);
							if (value) {
								dueString = value.toString();
								break;
							}
						} catch (error) {
							// 忽略错误，继续尝试下一个属性名
						}
					}
					
					const title = file.name.replace(/\.md$/, '');
					
					// 添加需要复习的卡片：
					// 1. 没有到期日期的卡片（新卡片）
					// 2. 到期日期在今天或之前的卡片
					const isNewCard = !dueString;
					let isDueCard = false;
					
					if (dueString) {
						try {
							isDueCard = dayjs(dueString).isSameOrBefore(now, 'day');
						} catch (error) {
							console.error('DashMemoryCardView - 日期解析错误:', dueString, error);
						}
					}
					
					if (isNewCard || isDueCard) {
						fileList.push({
							title,
							due: dueString || '新卡片',
							index: i,
							isNew: isNewCard
						});
					}
				}
			}
		}
		
		// 调试信息
		console.log('DashMemoryCardView - getReviewFileList:', {
			totalCards: this.sortedCards.length,
			reviewCards: fileList.length,
			fileList: fileList.map(f => ({title: f.title, due: f.due, isNew: f.isNew}))
		});
		
		return fileList;
	}
	
	private async getAllFileList(): Promise<Array<{title: string, due: string, index: number, isNew: boolean}>> {
		const fileList: Array<{title: string, due: string, index: number, isNew: boolean}> = [];
		
		for (let i = 0; i < this.sortedCards.length; i++) {
			const card = this.sortedCards[i];
			const filePath = card?.getValue('file.path');
			const filePathStr = typeof filePath === 'string' ? filePath : filePath?.toString() || '';
			
			if (filePathStr) {
				const file = this.app.vault.getAbstractFileByPath(filePathStr);
				if (file instanceof TFile) {
					// 尝试获取到期日期
					let dueString = '';
					const possiblePropNames = [
						'note.sr-due',
						'sr-due',
						'note.sr_due',
						'sr_due',
						'note.srDue',
						'srDue'
					];
					
					for (const propName of possiblePropNames) {
						try {
							const value = card.getValue(propName as any);
							if (value) {
								dueString = value.toString();
								break;
							}
						} catch (error) {
							// 忽略错误，继续尝试下一个属性名
						}
					}
					
					const title = file.name.replace(/\.md$/, '');
					const isNewCard = !dueString;
					
					fileList.push({
						title,
						due: dueString || '新卡片',
						index: i,
						isNew: isNewCard
					});
				}
			}
		}
		
		// 调试信息
		console.log('DashMemoryCardView - getAllFileList:', {
			totalCards: this.sortedCards.length,
			allCards: fileList.length,
			fileList: fileList.map(f => ({title: f.title, due: f.due, isNew: f.isNew}))
		});
		
		return fileList;
	}
	
	private handleFileSelect = (index: number) => {
		if (index >= 0 && index < this.sortedCards.length) {
			this.currentIndex = index;
			this.containerEl.empty();
			this.renderMemoryCard();
		}
	};

	private handlePrev = () => {
		// 移动到前一个卡片
		if (this.currentIndex > 0) {
			this.currentIndex--;
			this.containerEl.empty();
			this.renderMemoryCard();
		}
	};

	private handleNext = () => {
		// 移动到后一个卡片
		if (this.currentIndex < this.sortedCards.length - 1) {
			this.currentIndex++;
			this.containerEl.empty();
			this.renderMemoryCard();
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
	fileList?: Array<{title: string, due: string, index: number, isNew: boolean}>;
	currentFileIndex?: number;
	onFileSelect?: (index: number) => void;
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
	
	try {
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
	} catch (error) {
		console.error('Error in processFrontMatter:', error);
		// 如果processFrontMatter失败，尝试直接写入文件
		try {
			const content = await app.vault.read(file);
			const frontmatterRegex = /^---\s*[\s\S]*?---\s*/;
			const hasFrontmatter = frontmatterRegex.test(content);
			
			let newContent = '';
			if (hasFrontmatter) {
				// 替换现有的frontmatter
				const frontmatterStr = `---
sr-repetitions: ${repetitions}
sr-interval: ${interval}
sr-ease: ${ease}
sr-due: ${due.format('YYYY-MM-DD')}
sr-lapses: ${lapses}
---`;
				newContent = content.replace(frontmatterRegex, frontmatterStr + '\n');
			} else {
				// 添加新的frontmatter
				const frontmatterStr = `---
sr-repetitions: ${repetitions}
sr-interval: ${interval}
sr-ease: ${ease}
sr-due: ${due.format('YYYY-MM-DD')}
sr-lapses: ${lapses}
---

${content}`;
				newContent = frontmatterStr;
			}
			
			await app.vault.modify(file, newContent);
			refresh();
			return false;
		} catch (writeError) {
			console.error('Error writing file directly:', writeError);
			throw new Error(`无法更新文件 ${filePath}: ${writeError.message}`);
		}
	}
};

// 简单的Markdown渲染组件，使用Obsidian原生样式
const SimpleMarkdownView: React.FC<{
	markdown: string;
	app: any;
	filePath: string;
}> = ({ markdown, app, filePath }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	
	useEffect(() => {
		if (!containerRef.current) return;
		
		const container = containerRef.current;
		
		// 清空容器
		container.innerHTML = '';
		
		// 创建一个div来包装markdown内容
		const markdownContainer = document.createElement('div');
		markdownContainer.className = 'markdown-reading-view markdown-rendered';
		markdownContainer.style.cssText = `
			width: 100%;
			height: 100%;
			overflow-y: auto;
			padding: 0;
			font-family: var(--font-text);
			line-height: var(--line-height-normal);
			color: var(--text-normal);
		`;
		
		container.appendChild(markdownContainer);
		
		// 使用Obsidian的MarkdownRenderer
		MarkdownRenderer.renderMarkdown(
			markdown,
			markdownContainer,
			filePath,
			null as any
		);
		
		// 添加Obsidian的阅读模式样式
		setTimeout(() => {
			// 确保所有元素都有正确的Obsidian类
			const elements = markdownContainer.querySelectorAll('*');
			elements.forEach(el => {
				// 代码块
				if (el.tagName === 'PRE' && el.querySelector('code')) {
					el.classList.add('code-block');
					el.classList.add('code-block-wrap');
				}
				// 内联代码
				if (el.tagName === 'CODE' && !el.closest('pre')) {
					el.classList.add('inline-code');
				}
				// 链接
				if (el.tagName === 'A') {
					const href = el.getAttribute('href');
					if (href?.startsWith('#')) {
						el.classList.add('internal-link');
					} else if (href && !href.startsWith('http') && !href.startsWith('mailto:')) {
						el.classList.add('internal-link');
						// 添加点击事件
						el.addEventListener('click', async (e) => {
							e.preventDefault();
							e.stopPropagation();
							await app.workspace.openLinkText(href, filePath, true, { active: true });
						});
					} else {
						el.classList.add('external-link');
					}
				}
				// 表格
				if (el.tagName === 'TABLE') {
					el.classList.add('table-view-table');
				}
				// 引用
				if (el.tagName === 'BLOCKQUOTE') {
					el.classList.add('blockquote');
				}
				// 任务列表
				if (el.tagName === 'UL' && el.classList.contains('contains-task-list')) {
					el.classList.add('contains-task-list');
				}
			});
		}, 100);
		
	}, [markdown, app, filePath]);
	
	return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
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
												   isNextDisabled,
												   fileList = [],
												   currentFileIndex = 0,
												   onFileSelect = () => {}
											   }) => {
	const [fm, setFM] = useState(frontmatter);
	const [showModal, setShowModal] = useState(false);

	const refresh = async () => {
		// 刷新数据：重新获取卡片数据并重新渲染
		// 这个函数会被updateSRFrontmatter调用
		// 在实际实现中，这里应该触发父组件重新加载数据
		// 目前我们先留空，因为数据更新已经在updateSRFrontmatter中处理了
	};

	const handleDifficulty = async (action: 'hard' | 'medium' | 'easy') => {
		try {
			let rating: 1 | 3 | 5 = 3;
			if (action === 'hard') rating = 1;
			else if (action === 'medium') rating = 3;
			else if (action === 'easy') rating = 5;
			const isDueOverYear = await updateSRFrontmatter(app, filePath, fm, rating, refresh);
			if (isDueOverYear) {
				setShowModal(true);
			}
		} catch (error) {
			console.error('Error updating SR frontmatter:', error);
			// 显示错误提示
			notification.error({
				message: '更新失败',
				description: '无法更新记忆卡片状态，请检查文件是否有frontmatter',
				duration: 3,
			});
		} finally {
			// 无论成功与否，都跳转到下一个卡片
			onNext();
		}
	};

	return (
		<>
			<div style={{display: 'flex', height: 'calc(100vh - 80px)', margin: 0}}>
				{/* 左侧文件列表 */}
				{fileList.length > 0 && (
					<div style={{
						width: '320px',
						borderRight: '1px solid #e8e8e8',
						overflowY: 'auto',
						padding: '20px',
						background: 'linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%)',
						boxShadow: '2px 0 8px rgba(0,0,0,0.05)'
					}}>
						<div style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							marginBottom: '20px',
							paddingBottom: '12px',
							borderBottom: '2px solid #1890ff'
						}}>
							<h3 style={{
								margin: 0,
								color: '#1890ff',
								fontSize: '18px',
								fontWeight: '600',
								display: 'flex',
								alignItems: 'center',
								gap: '8px'
							}}>
								<span style={{
									background: '#1890ff',
									color: 'white',
									width: '28px',
									height: '28px',
									borderRadius: '50%',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: '14px'
								}}>
									📚
								</span>
								复习列表
							</h3>
							<span style={{
								background: '#1890ff',
								color: 'white',
								fontSize: '12px',
								fontWeight: 'bold',
								padding: '4px 10px',
								borderRadius: '12px'
							}}>
								{fileList.length}
							</span>
						</div>
						<div style={{
							fontSize: '13px',
							color: '#666',
							marginBottom: '16px',
							padding: '10px',
							background: 'rgba(24, 144, 255, 0.05)',
							borderRadius: '6px',
							borderLeft: '3px solid #1890ff'
						}}>
							💡 点击文件快速切换
						</div>
						<div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
							{fileList.map((file, idx) => {
								const isCurrent = file.index === currentFileIndex;
								const isNewCard = file.isNew;
								let dueDate = null;
								let isOverdue = false;
								
								if (!isNewCard && file.due !== '新卡片') {
									try {
										dueDate = dayjs(file.due);
										isOverdue = dueDate.isBefore(dayjs(), 'day');
									} catch (error) {
										console.error('日期解析错误:', file.due, error);
									}
								}
								
								return (
									<div
										key={`file-${file.index}-${file.title}`}
										onClick={() => onFileSelect(file.index)}
										style={{
											padding: '16px',
											borderRadius: '10px',
											border: isCurrent ? '2px solid #1890ff' : '1px solid #e8e8e8',
											background: isCurrent 
												? 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)' 
												: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
											cursor: 'pointer',
											transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
											position: 'relative',
											overflow: 'hidden',
											boxShadow: isCurrent 
												? '0 4px 12px rgba(24, 144, 255, 0.2)' 
												: '0 2px 6px rgba(0,0,0,0.05)'
										}}
										onMouseEnter={(e) => {
											if (!isCurrent) {
												e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)';
												e.currentTarget.style.transform = 'translateY(-3px)';
												e.currentTarget.style.borderColor = '#69c0ff';
											}
										}}
										onMouseLeave={(e) => {
											if (!isCurrent) {
												e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)';
												e.currentTarget.style.transform = 'translateY(0)';
												e.currentTarget.style.borderColor = '#e8e8e8';
											}
										}}
									>
										{isCurrent && (
											<div style={{
												position: 'absolute',
												top: 0,
												left: 0,
												width: '6px',
												height: '100%',
												background: 'linear-gradient(to bottom, #1890ff, #096dd9)',
												borderRadius: '10px 0 0 10px'
											}}/>
										)}
										<div style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'flex-start',
											marginBottom: '8px',
											position: 'relative',
											zIndex: 1
										}}>
											<div style={{
												flex: 1,
												minWidth: 0
											}}>
												<div style={{
													display: 'flex',
													alignItems: 'center',
													gap: '8px',
													marginBottom: '4px'
												}}>
													{isCurrent && (
														<span style={{
															background: '#1890ff',
															color: 'white',
															width: '20px',
															height: '20px',
															borderRadius: '50%',
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
															fontSize: '12px',
															fontWeight: 'bold'
														}}>
															▶
														</span>
													)}
													<div style={{
														fontWeight: isCurrent ? '700' : '600',
														color: isCurrent ? '#1890ff' : '#333',
														fontSize: '15px',
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														whiteSpace: 'nowrap',
														lineHeight: '1.4'
													}}>
														{file.title}
													</div>
												</div>
												<div style={{
													fontSize: '12px',
													color: isNewCard ? '#52c41a' : (isOverdue ? '#ff4d4f' : '#666'),
													display: 'flex',
													alignItems: 'center',
													gap: '6px',
													marginTop: '4px'
												}}>
													<span style={{
														display: 'flex',
														alignItems: 'center',
														gap: '4px'
													}}>
														{isNewCard ? '🆕' : (isOverdue ? '⚠️' : '📅')}
														{isNewCard ? '新卡片' : `到期: ${dueDate ? dueDate.format('MM-DD') : file.due}`}
													</span>
												</div>
											</div>
											<div style={{
												display: 'flex',
												flexDirection: 'column',
												alignItems: 'flex-end',
												gap: '4px'
											}}>
												{isNewCard ? (
													<span style={{
														background: 'linear-gradient(135deg, #52c41a, #73d13d)',
														color: 'white',
														fontSize: '11px',
														fontWeight: 'bold',
														padding: '3px 8px',
														borderRadius: '12px',
														boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)'
													}}>
														新
													</span>
												) : isOverdue ? (
													<span style={{
														background: 'linear-gradient(135deg, #ff4d4f, #ff7875)',
														color: 'white',
														fontSize: '11px',
														fontWeight: 'bold',
														padding: '3px 8px',
														borderRadius: '12px',
														boxShadow: '0 2px 4px rgba(255, 77, 79, 0.3)'
													}}>
														逾期
													</span>
												) : null}
												<span style={{
													fontSize: '12px',
													color: '#999',
													fontWeight: '500'
												}}>
													#{idx + 1}
												</span>
											</div>
										</div>
										{isCurrent && (
											<div style={{
												position: 'absolute',
												bottom: 0,
												right: 0,
												width: '40px',
												height: '40px',
												background: 'radial-gradient(circle at 100% 100%, rgba(24, 144, 255, 0.1) 0%, transparent 70%)',
												borderRadius: '0 0 10px 0'
											}}/>
										)}
									</div>
								);
							})}
						</div>
					</div>
				)}
				
				{/* 右侧卡片内容 */}
				<div style={{
					flex: 1,
					overflowY: 'auto',
					padding: '30px',
					background: 'linear-gradient(135deg, #f0f2f5 0%, #e6f7ff 100%)',
					position: 'relative'
				}}>
					<div style={{
						maxWidth: '1000px',
						margin: '0 auto',
						position: 'relative'
					}}>
						<Card style={{
							padding: '32px',
							borderRadius: '16px',
							boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
							border: '1px solid rgba(24, 144, 255, 0.1)',
							background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
							position: 'relative',
							overflow: 'hidden'
						}}>
							{/* 装饰性背景元素 */}
							<div style={{
								position: 'absolute',
								top: 0,
								right: 0,
								width: '200px',
								height: '200px',
								background: 'radial-gradient(circle at 100% 0%, rgba(24, 144, 255, 0.05) 0%, transparent 70%)',
								borderRadius: '0 0 0 100%'
							}}/>
							
							<div style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								marginBottom: '24px',
								paddingBottom: '16px',
								borderBottom: '2px solid #e6f7ff',
								position: 'relative',
								zIndex: 1
							}}>
								<h2 style={{
									margin: 0,
									color: '#1890ff',
									fontSize: '28px',
									fontWeight: '700',
									display: 'flex',
									alignItems: 'center',
									gap: '12px'
								}}>
									<span style={{
										background: 'linear-gradient(135deg, #1890ff, #096dd9)',
										color: 'white',
										width: '40px',
										height: '40px',
										borderRadius: '50%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: '20px',
										boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
									}}>
										📄
									</span>
									{title}
								</h2>
								<div style={{
									display: 'flex',
									alignItems: 'center',
									gap: '12px'
								}}>
									{fileList.length > 0 && (
										<div style={{
											background: 'linear-gradient(135deg, #f6ffed, #d9f7be)',
											padding: '8px 16px',
											borderRadius: '20px',
											fontSize: '14px',
											fontWeight: '600',
											color: '#52c41a',
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											boxShadow: '0 2px 8px rgba(82, 196, 26, 0.1)'
										}}>
											<span>📊</span>
											<span>进度: {fileList.findIndex(f => f.index === currentFileIndex) + 1}/{fileList.length}</span>
										</div>
									)}
								</div>
							</div>
							
							{frontmatter && (
								<div style={{
									marginBottom: '24px',
									background: 'linear-gradient(135deg, #f6ffed, #e6fffb)',
									borderRadius: '12px',
									padding: '20px',
									border: '1px solid #b7eb8f',
									boxShadow: '0 4px 12px rgba(183, 235, 143, 0.1)',
									position: 'relative',
									zIndex: 1
								}}>
									<div style={{
										display: 'flex',
										alignItems: 'center',
										gap: '10px',
										marginBottom: '16px'
									}}>
										<div style={{
											background: '#52c41a',
											color: 'white',
											width: '32px',
											height: '32px',
											borderRadius: '50%',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: '16px'
										}}>
											📊
										</div>
										<h3 style={{
											margin: 0,
											color: '#52c41a',
											fontSize: '18px',
											fontWeight: '600'
										}}>
											记忆状态
										</h3>
									</div>
									<div style={{
										display: 'grid',
										gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
										gap: '16px'
									}}>
										{Object.entries(frontmatter)
											.filter(([key]) => key.startsWith('sr-'))
											.map(([key, value]) => (
												<div key={key} style={{
													background: 'white',
													padding: '16px',
													borderRadius: '10px',
													border: '1px solid #d9f7be',
													boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
													transition: 'all 0.3s'
												}}>
													<div style={{
														fontSize: '12px',
														color: '#666',
														marginBottom: '6px',
														fontWeight: '500',
														textTransform: 'uppercase',
														letterSpacing: '0.5px'
													}}>
														{key.replace('sr-', '')}
													</div>
													<div style={{
														fontSize: '18px',
														fontWeight: '700',
														color: '#1890ff',
														display: 'flex',
														alignItems: 'center',
														gap: '8px'
													}}>
														{String(value)}
														{key === 'sr-due' && (
															<span style={{
																fontSize: '12px',
																background: dayjs(value as string).isBefore(dayjs(), 'day') 
																	? '#fff2f0' 
																	: '#f6ffed',
																color: dayjs(value as string).isBefore(dayjs(), 'day')
																	? '#ff4d4f'
																	: '#52c41a',
																padding: '2px 8px',
																borderRadius: '10px',
																fontWeight: '500'
															}}>
																{dayjs(value as string).isBefore(dayjs(), 'day') ? '逾期' : '进行中'}
															</span>
														)}
													</div>
												</div>
											))}
									</div>
								</div>
							)}
							
							<div style={{
								marginBottom: '24px',
								background: 'linear-gradient(135deg, #f0f8ff, #e6f7ff)',
								borderRadius: '12px',
								padding: '20px',
								border: '1px solid #91d5ff',
								position: 'relative',
								zIndex: 1,
								boxShadow: '0 4px 12px rgba(145, 213, 255, 0.1)'
							}}>
								<div style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									marginBottom: '12px'
								}}>
									<div style={{
										display: 'flex',
										alignItems: 'center',
										gap: '10px'
									}}>
										<div style={{
											background: '#1890ff',
											color: 'white',
											width: '32px',
											height: '32px',
											borderRadius: '50%',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: '16px'
										}}>
											📝
										</div>
										<div style={{
											fontSize: '16px',
											fontWeight: '600',
											color: '#1890ff'
										}}>
											内容预览
										</div>
									</div>
									<div style={{
										fontSize: '13px',
										color: '#666',
										background: 'white',
										padding: '4px 12px',
										borderRadius: '12px',
										border: '1px solid #91d5ff'
									}}>
										{markdown.length > 0 ? `${Math.ceil(markdown.length / 1000)}k 字符` : '空内容'}
									</div>
								</div>
								<div style={{
									fontSize: '14px',
									color: '#666',
									lineHeight: '1.6'
								}}>
									浏览下方完整内容，完成后点击难度按钮进行评分
								</div>
							</div>
							
							<div style={{
									overflowY: 'auto',
									maxHeight: 'calc(100vh - 400px)',
									minHeight: '300px',
									padding: '24px',
									border: '1px solid #f0f0f0',
									borderRadius: '12px',
									background: 'white',
									boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.04)',
									position: 'relative',
									zIndex: 1
								}}>
								<SimpleMarkdownView 
									markdown={markdown}
									app={app}
									filePath={filePath}
								/>
							</div>
						</Card>
					</div>
				</div>
			</div>
			<div style={{
				position: 'fixed',
				left: fileList.length > 0 ? '320px' : '0',
				right: 0,
				bottom: 0,
				zIndex: 100,
				background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(240, 242, 245, 0.98) 100%)',
				backdropFilter: 'blur(10px)',
				boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
				padding: '20px 0',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				borderTop: '1px solid rgba(24, 144, 255, 0.1)'
			}}>
				<div style={{
					display: 'flex',
					alignItems: 'center',
					gap: '24px',
					maxWidth: '800px',
					width: '100%',
					justifyContent: 'center'
				}}>
					<Button
						onClick={onPrev}
						disabled={isPrevDisabled}
						type="default"
						size="large"
						style={{
							minWidth: '120px',
							height: '48px',
							fontSize: '16px',
							fontWeight: '600',
							borderRadius: '24px',
							border: '2px solid #1890ff',
							background: isPrevDisabled ? '#f5f5f5' : 'white',
							color: isPrevDisabled ? '#bfbfbf' : '#1890ff',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '8px',
							boxShadow: '0 4px 12px rgba(24, 144, 255, 0.15)',
							transition: 'all 0.3s'
						}}
						onMouseEnter={(e) => {
							if (!isPrevDisabled) {
								e.currentTarget.style.transform = 'translateY(-2px)';
								e.currentTarget.style.boxShadow = '0 6px 16px rgba(24, 144, 255, 0.25)';
							}
						}}
						onMouseLeave={(e) => {
							if (!isPrevDisabled) {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.15)';
							}
						}}
					>
						<span style={{fontSize: '18px'}}>⬅</span>
						上一个
					</Button>
					
					<div style={{
						display: 'flex',
						alignItems: 'center',
						gap: '16px',
						background: 'white',
						padding: '8px',
						borderRadius: '28px',
						boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
						border: '1px solid rgba(24, 144, 255, 0.1)'
					}}>
						<Button 
							type="primary" 
							danger 
							onClick={() => handleDifficulty('hard')}
							size="large"
							style={{
								minWidth: '100px',
								height: '48px',
								fontSize: '16px',
								fontWeight: '700',
								borderRadius: '24px',
								background: 'linear-gradient(135deg, #ff4d4f, #ff7875)',
								border: 'none',
								boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)',
								transition: 'all 0.3s'
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.transform = 'translateY(-2px)';
								e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 77, 79, 0.4)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 77, 79, 0.3)';
							}}
						>
							困难
						</Button>
						<Button
							type="default"
							onClick={() => handleDifficulty('medium')}
							size="large"
							style={{
								minWidth: '100px',
								height: '48px',
								fontSize: '16px',
								fontWeight: '700',
								borderRadius: '24px',
								background: 'linear-gradient(135deg, #faad14, #ffc53d)',
								border: 'none',
								color: 'white',
								boxShadow: '0 4px 12px rgba(250, 173, 20, 0.3)',
								transition: 'all 0.3s'
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.transform = 'translateY(-2px)';
								e.currentTarget.style.boxShadow = '0 6px 20px rgba(250, 173, 20, 0.4)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = '0 4px 12px rgba(250, 173, 20, 0.3)';
							}}
						>
							中等
						</Button>
						<Button
							type="primary"
							onClick={() => handleDifficulty('easy')}
							size="large"
							style={{
								minWidth: '100px',
								height: '48px',
								fontSize: '16px',
								fontWeight: '700',
								borderRadius: '24px',
								background: 'linear-gradient(135deg, #52c41a, #73d13d)',
								border: 'none',
								boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)',
								transition: 'all 0.3s'
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.transform = 'translateY(-2px)';
								e.currentTarget.style.boxShadow = '0 6px 20px rgba(82, 196, 26, 0.4)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = '0 4px 12px rgba(82, 196, 26, 0.3)';
							}}
						>
							简单
						</Button>
					</div>
					
					<Button
						onClick={onNext}
						disabled={isNextDisabled}
						type="default"
						size="large"
						style={{
							minWidth: '120px',
							height: '48px',
							fontSize: '16px',
							fontWeight: '600',
							borderRadius: '24px',
							border: '2px solid #1890ff',
							background: isNextDisabled ? '#f5f5f5' : 'white',
							color: isNextDisabled ? '#bfbfbf' : '#1890ff',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '8px',
							boxShadow: '0 4px 12px rgba(24, 144, 255, 0.15)',
							transition: 'all 0.3s'
						}}
						onMouseEnter={(e) => {
							if (!isNextDisabled) {
								e.currentTarget.style.transform = 'translateY(-2px)';
								e.currentTarget.style.boxShadow = '0 6px 16px rgba(24, 144, 255, 0.25)';
							}
						}}
						onMouseLeave={(e) => {
							if (!isNextDisabled) {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.15)';
							}
						}}
					>
						下一个
						<span style={{fontSize: '18px'}}>➡</span>
					</Button>
				</div>
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
