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
												   isNextDisabled,
												   fileList = [],
												   currentFileIndex = 0,
												   onFileSelect = () => {}
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
				
				// 添加一些自定义样式到渲染的markdown内容
				setTimeout(() => {
					if (mdRef.current) {
						// 为渲染的markdown内容添加一些样式
						const elements = mdRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
						elements.forEach(el => {
							(el as HTMLElement).style.color = '#1890ff';
						});
						
						// 为代码块添加样式
						const codeBlocks = mdRef.current.querySelectorAll('pre code');
						codeBlocks.forEach(el => {
							(el as HTMLElement).style.background = '#f6f8fa';
							(el as HTMLElement).style.padding = '12px';
							(el as HTMLElement).style.borderRadius = '6px';
							(el as HTMLElement).style.display = 'block';
							(el as HTMLElement).style.overflowX = 'auto';
						});
					}
				}, 100);
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
			<div style={{display: 'flex', height: 'calc(100vh - 100px)', marginTop: '20px'}}>
				{/* 左侧文件列表 */}
				{fileList.length > 0 && (
					<div style={{
						width: '300px',
						borderRight: '1px solid #f0f0f0',
						overflowY: 'auto',
						padding: '16px',
						background: '#fafafa'
					}}>
						<h3 style={{marginBottom: '16px', color: '#1890ff'}}>
							📚 复习列表 ({fileList.length})
						</h3>
						<div style={{fontSize: '12px', color: '#666', marginBottom: '12px'}}>
							点击文件快速切换
						</div>
						<div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
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
											padding: '12px',
											borderRadius: '6px',
											border: isCurrent ? '2px solid #1890ff' : '1px solid #e8e8e8',
											background: isCurrent ? '#e6f7ff' : '#fff',
											cursor: 'pointer',
											transition: 'all 0.2s',
											position: 'relative',
											overflow: 'hidden'
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
											e.currentTarget.style.transform = 'translateY(-2px)';
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.boxShadow = 'none';
											e.currentTarget.style.transform = 'translateY(0)';
										}}
									>
										<div style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											marginBottom: '4px'
										}}>
											<div style={{
												fontWeight: isCurrent ? 'bold' : 'normal',
												color: isCurrent ? '#1890ff' : '#333',
												fontSize: '14px',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap'
											}}>
												{isCurrent && '▶ '}
												{file.title}
											</div>
											{isNewCard ? (
												<span style={{
													background: '#52c41a',
													color: 'white',
													fontSize: '10px',
													padding: '2px 6px',
													borderRadius: '10px'
												}}>
													新
												</span>
											) : isOverdue ? (
												<span style={{
													background: '#ff4d4f',
													color: 'white',
													fontSize: '10px',
													padding: '2px 6px',
													borderRadius: '10px'
												}}>
													逾期
												</span>
											) : null}
										</div>
										<div style={{
											fontSize: '12px',
											color: isNewCard ? '#52c41a' : (isOverdue ? '#ff4d4f' : '#666'),
											display: 'flex',
											justifyContent: 'space-between'
										}}>
											<span>
												{isNewCard ? '🆕 新卡片' : `到期: ${dueDate ? dueDate.format('MM-DD') : file.due}`}
											</span>
											<span>#{idx + 1}</span>
										</div>
										{isCurrent && (
											<div style={{
												position: 'absolute',
												top: 0,
												right: 0,
												width: '4px',
												height: '100%',
												background: '#1890ff'
											}}/>
										)}
									</div>
								);
							})}
						</div>
					</div>
				)}
				
				{/* 右侧卡片内容 */}
				<div style={{flex: 1, overflowY: 'auto', padding: '20px'}}>
					<Card style={{maxWidth: '800px', margin: '0 auto', padding: '24px'}}>
						<h2 style={{textAlign: 'center', marginBottom: '16px', color: '#1890ff'}}>
							{title}
						</h2>
						{frontmatter && (
							<div style={{marginBottom: '16px'}}>
								<div style={{
									fontSize: '14px',
									color: '#666',
									marginBottom: '8px',
									display: 'flex',
									alignItems: 'center',
									gap: '8px'
								}}>
									<span>📊 记忆状态:</span>
								</div>
								<table style={{
									width: '100%',
									fontSize: '13px',
									background: '#f6ffed',
									borderRadius: '4px',
									borderCollapse: 'collapse'
								}}>
									<tbody>
									{Object.entries(frontmatter)
										.filter(([key]) => key.startsWith('sr-'))
										.map(([key, value]) => (
											<tr key={key}>
												<td style={{
													fontWeight: 'bold',
													padding: '6px 12px',
													width: '120px',
													borderBottom: '1px solid #e8e8e8'
												}}>
													{key.replace('sr-', '')}
												</td>
												<td style={{
													padding: '6px 12px',
													borderBottom: '1px solid #e8e8e8'
												}}>
													{String(value)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
						<div style={{
							marginBottom: '16px',
							padding: '12px',
							background: '#f0f8ff',
							borderRadius: '6px',
							fontSize: '13px',
							color: '#666'
						}}>
							<div style={{display: 'flex', justifyContent: 'space-between'}}>
								<span>📝 内容预览:</span>
								<span>{fileList.length > 0 ? `进度: ${fileList.findIndex(f => f.index === currentFileIndex) + 1}/${fileList.length}` : ''}</span>
							</div>
						</div>
						<div 
							ref={mdRef} 
							style={{
								overflowY: 'auto',
								maxHeight: '400px',
								padding: '16px',
								border: '1px solid #f0f0f0',
								borderRadius: '6px',
								background: '#fff'
							}}
						/>
					</Card>
				</div>
			</div>
			<div style={{
				position: 'fixed',
				left: fileList.length > 0 ? '300px' : '0',
				right: 0,
				bottom: 0,
				zIndex: 100,
				background: 'rgba(255,255,255,0.97)',
				boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
				padding: '16px 0',
				display: 'flex',
				justifyContent: 'center',
				transition: 'left 0.3s'
			}}>
				<Space>
					<Button
						style={{marginRight: 30}}
						onClick={onPrev}
						disabled={isPrevDisabled}
						type="default"
						size="large"
					>
						⬅ 上一个
					</Button>
					<Button 
						type="primary" 
						danger 
						onClick={() => handleDifficulty('hard')}
						size="large"
						style={{minWidth: '80px'}}
					>
						困难
					</Button>
					<Button
						type="default"
						style={{backgroundColor: '#87CEEB', color: '#000', minWidth: '80px'}}
						onClick={() => handleDifficulty('medium')}
						size="large"
					>
						中等
					</Button>
					<Button
						type="primary"
						style={{backgroundColor: '#98FB98', color: '#000', minWidth: '80px'}}
						onClick={() => handleDifficulty('easy')}
						size="large"
					>
						简单
					</Button>
					<Button
						style={{marginLeft: 30}}
						onClick={onNext}
						disabled={isNextDisabled}
						type="default"
						size="large"
					>
						下一个 ➡
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
