// 全局变量
let currentLang = 'zh';
let poems = {};
let config = {};

// 应用程序主对象
const App = {
    // 数据管理器
    DataManager: {
        async loadData() {
            try {
                const response = await fetch('./data/data.json');
                const data = await response.json();
                poems = data.poems;
                config = data.config;
                return data;
            } catch (error) {
                console.error('Failed to load data:', error);
                // 降级处理：如果加载失败，使用空数据
                poems = { zh: [], en: [] };
                config = { zh: {}, en: {} };
                return { poems, config };
            }
        }
    },

    // 语言管理器
    LanguageManager: {
        // 切换语言
        changeLanguage(lang) {
            if (!lang || (lang !== 'zh' && lang !== 'en')) {
                console.warn('Invalid language:', lang);
                return;
            }
            
            console.log('Changing language from', currentLang, 'to', lang);
            currentLang = lang;
            
            // 更新页面内容
            this.updateContent();
            
            // 更新语言按钮
            this.updateLanguageButton();
            
            // 切换语言后，重新显示当前诗词（保持索引）
            App.PoemManager.displayCurrentPoem();
            
            console.log('Language changed successfully to:', currentLang);
        },

        // 更新页面内容
        updateContent() {
            if (!config[currentLang]) {
                console.warn('Config not found for language:', currentLang);
                return;
            }

            const langConfig = config[currentLang];
            
            // 更新标题
            const titleElement = document.querySelector('#message h1');
            if (titleElement && langConfig.title) {
                titleElement.textContent = langConfig.title;
            }
            
            // 更新问候语（时间问候语 + 欢迎语）
            App.Utils.updateGreeting();

            // 更新导航链接文字
            this.updateNavigationText(langConfig);
        },

        // 更新导航文字
        updateNavigationText(langConfig) {
            if (!langConfig.navigation) return;

            const blogLink = document.querySelector('.go2blogwork a[href*="blog"]');
            const workLink = document.querySelector('.go2blogwork a[href*="work"]');

            if (blogLink && langConfig.navigation.blog) {
                blogLink.textContent = langConfig.navigation.blog;
            }
            if (workLink && langConfig.navigation.work) {
                workLink.textContent = langConfig.navigation.work;
            }
        },

        // 更新语言切换按钮
        updateLanguageButton() {
            const languageSwitcher = document.querySelector('.language-switcher');
            if (!languageSwitcher) {
                console.error('Language switcher container not found');
                return;
            }

            // 移除现有的语言按钮（保留❤️Eve按钮）
            const languageButtons = languageSwitcher.querySelectorAll('a:not([href*="eve.ihogu.com"])');
            languageButtons.forEach(btn => btn.remove());

            // 创建新的语言按钮
            const langButton = document.createElement('a');
            langButton.href = '#';
            langButton.className = 'language-button';
            
            // 设置按钮内容和点击事件
            if (currentLang === 'zh') {
                // 当前是中文，显示English按钮
                langButton.innerHTML = '🌐English';
                langButton.dataset.targetLang = 'en';
            } else {
                // 当前是英文，显示中文按钮
                langButton.innerHTML = '🇨🇳中文';
                langButton.dataset.targetLang = 'zh';
            }

            // 添加点击事件监听器
            langButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const targetLang = e.currentTarget.dataset.targetLang;
                console.log('Language button clicked, switching to:', targetLang);
                this.changeLanguage(targetLang);
            });

            // 将按钮添加到容器
            languageSwitcher.appendChild(langButton);
            
            console.log('Language button updated for lang:', currentLang);
        }
    },

    // 诗词管理器
    PoemManager: {
        currentIndex: 0,

        // 显示当前索引的诗词（用于语言切换时保持位置）
        displayCurrentPoem() {
            if (!poems[currentLang] || poems[currentLang].length === 0) {
                console.warn('No poems available for language:', currentLang);
                // 如果当前语言没有诗词，尝试显示默认语言的诗词
                const fallbackLang = currentLang === 'zh' ? 'en' : 'zh';
                if (poems[fallbackLang] && poems[fallbackLang].length > 0) {
                    const poemList = poems[fallbackLang];
                    this.currentIndex = Math.min(this.currentIndex, poemList.length - 1);
                    this.displayPoem(poemList[this.currentIndex]);
                }
                return;
            }

            const poemList = poems[currentLang];
            // 确保索引在有效范围内
            if (this.currentIndex >= poemList.length) {
                this.currentIndex = 0;
            }
            
            console.log('Displaying poem for language:', currentLang, 'index:', this.currentIndex);
            this.displayPoem(poemList[this.currentIndex]);
        },

        // 显示随机诗词
        showRandomPoem() {
            if (!poems[currentLang] || poems[currentLang].length === 0) {
                console.warn('No poems available for language:', currentLang);
                return;
            }

            const poemList = poems[currentLang];
            this.currentIndex = Math.floor(Math.random() * poemList.length);
            this.displayPoem(poemList[this.currentIndex]);
        },

        // 显示下一首诗词
        showNextPoem() {
            if (!poems[currentLang] || poems[currentLang].length === 0) {
                return;
            }

            const poemList = poems[currentLang];
            this.currentIndex = (this.currentIndex + 1) % poemList.length;
            this.displayPoem(poemList[this.currentIndex]);
        },

        // 显示上一首诗词
        showPrevPoem() {
            if (!poems[currentLang] || poems[currentLang].length === 0) {
                return;
            }

            const poemList = poems[currentLang];
            this.currentIndex = (this.currentIndex - 1 + poemList.length) % poemList.length;
            this.displayPoem(poemList[this.currentIndex]);
        },

        // 显示诗词内容
        displayPoem(poem) {
            if (!poem) return;

            const container = document.querySelector('.main-shici');
            if (!container) return;

            // 清空现有内容
            container.innerHTML = '';

            // 创建诗词标题
            if (poem.title || poem.author) {
                const titleP = document.createElement('p');
                titleP.style.fontWeight = 'bold';
                titleP.style.fontSize = '20px';
                titleP.style.marginBottom = '15px';
                titleP.style.color = '#2c3e50';
                
                let titleText = '';
                if (poem.title) titleText += poem.title;
                if (poem.author) titleText += (titleText ? ' - ' : '') + poem.author;
                titleP.textContent = titleText;
                
                container.appendChild(titleP);
            }

            // 分隔线
            const hr = document.createElement('hr');
            container.appendChild(hr);

            // 创建诗词内容区域
            const article = document.createElement('div');
            article.className = 'article chushibiao';
            article.style.display = 'block';

            // 添加诗词内容
            const poemContent = poem.content || poem.item;
            if (poemContent) {
                const lines = Array.isArray(poemContent) ? poemContent : poemContent.split('\n');
                lines.forEach(line => {
                    if (line.trim()) {
                        const p = document.createElement('p');
                        p.textContent = line.trim();
                        article.appendChild(p);
                    }
                });
            }

            container.appendChild(article);

            // 添加导航按钮
            this.addNavigationButtons(container);
        },

        // 添加导航按钮
        addNavigationButtons(container) {
            const navDiv = document.createElement('div');
            navDiv.style.textAlign = 'center';
            navDiv.style.marginTop = '10px';
            navDiv.style.padding = '8px';

            const prevBtn = document.createElement('button');
            prevBtn.textContent = currentLang === 'zh' ? '上一篇' : 'Previous';
            prevBtn.onclick = () => this.showPrevPoem();
            this.styleButton(prevBtn);

            const nextBtn = document.createElement('button');
            nextBtn.textContent = currentLang === 'zh' ? '下一篇' : 'Next';
            nextBtn.onclick = () => this.showNextPoem();
            this.styleButton(nextBtn);

            const randomBtn = document.createElement('button');
            randomBtn.textContent = currentLang === 'zh' ? '随机' : 'Random';
            randomBtn.onclick = () => this.showRandomPoem();
            this.styleButton(randomBtn);

            navDiv.appendChild(prevBtn);
            navDiv.appendChild(randomBtn);
            navDiv.appendChild(nextBtn);
            container.appendChild(navDiv);
        },

        // 按钮样式
        styleButton(button) {
            button.style.cssText = `
                margin: 0 5px;
                padding: 6px 12px;
                background: linear-gradient(45deg, #689f38, #4a7c3a);
                color: white;
                border: none;
                border-radius: 15px;
                cursor: pointer;
                font-weight: 500;
                font-size: 14px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(104, 159, 56, 0.4);
            `;

            button.onmouseover = function() {
                this.style.background = 'linear-gradient(45deg, #5d8a2f, #3e5e2a)';
                this.style.boxShadow = '0 6px 20px rgba(104, 159, 56, 0.6)';
                this.style.transform = 'translateY(-2px)';
            };

            button.onmouseout = function() {
                this.style.background = 'linear-gradient(45deg, #689f38, #4a7c3a)';
                this.style.boxShadow = '0 4px 15px rgba(104, 159, 56, 0.4)';
                this.style.transform = 'translateY(0)';
            };
        }
    },

    // 工具函数
    Utils: {
        // 获取当前时间问候语
        getTimeGreeting() {
            const hour = new Date().getHours();
            const greetings = config[currentLang]?.greetings;
            
            if (!greetings) return '';

            if (hour >= 5 && hour < 12) {
                return greetings.morning || '';
            } else if (hour >= 12 && hour < 18) {
                return greetings.afternoon || '';
            } else {
                return greetings.evening || '';
            }
        },

        // 更新问候语
        updateGreeting() {
            const timeGreeting = this.getTimeGreeting();
            const welcomeConfig = config[currentLang]?.welcome || '';
            const welcomeElement = document.getElementById('welcome');
            
            if (welcomeElement) {
                // 组合时间问候语和配置中的欢迎语
                let combinedGreeting = '';
                if (timeGreeting && welcomeConfig) {
                    combinedGreeting = `${timeGreeting} ${welcomeConfig}`;
                } else if (timeGreeting) {
                    combinedGreeting = timeGreeting;
                } else if (welcomeConfig) {
                    combinedGreeting = welcomeConfig;
                }
                
                welcomeElement.textContent = combinedGreeting;
            }
        },

        // 更新当前年份
        updateCurrentYear() {
            const currentYear = new Date().getFullYear();
            const copyrightElement = document.querySelector('.icp p');
            if (copyrightElement) {
                copyrightElement.textContent = `© ${currentYear} Harry Work. All rights reserved.`;
            }
        }
    },

    // 初始化应用
    async init() {
        try {
            console.log('Starting app initialization...');
            
            // 加载数据
            await this.DataManager.loadData();
            console.log('Data loaded:', { poems: Object.keys(poems), config: Object.keys(config) });
            
            // 设置默认语言
            this.LanguageManager.changeLanguage('zh');
            
            // 显示随机诗词
            this.PoemManager.showRandomPoem();
            
            // 更新问候语
            this.Utils.updateGreeting();
            
            // 更新年份
            this.Utils.updateCurrentYear();
            
            // 验证语言切换器是否存在
            const languageSwitcher = document.querySelector('.language-switcher');
            if (languageSwitcher) {
                console.log('Language switcher found:', languageSwitcher);
                console.log('Current buttons:', languageSwitcher.querySelectorAll('a'));
            } else {
                console.error('Language switcher not found!');
            }
            
            console.log('App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }
};

// 全局函数，供HTML调用 (已不再需要，但保留以防万一)
function changeLanguage(lang) {
    App.LanguageManager.changeLanguage(lang);
    App.PoemManager.showRandomPoem();
    App.Utils.updateGreeting();
}

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});

// 页面加载完成后的额外处理
window.addEventListener('load', function() {
    // 如果有需要的话，可以在这里添加额外的初始化逻辑
    console.log('Page fully loaded');
});
