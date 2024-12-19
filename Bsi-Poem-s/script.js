       // Модуль для работы с данными
       const DataModule = (function() {
        const STORAGE_KEY = 'poems_data';
        
        // Приватные методы
        const serialize = data => JSON.stringify(data);
        const deserialize = data => JSON.parse(data);
        
        return {
            save(poems) {
                try {
                    localStorage.setItem(STORAGE_KEY, serialize(poems));
                    return true;
                } catch (error) {
                    console.error('Error saving data:', error);
                    return false;
                }
            },
            
            load() {
                try {
                    const data = localStorage.getItem(STORAGE_KEY);
                    return data ? deserialize(data) : [];
                } catch (error) {
                    console.error('Error loading data:', error);
                    return [];
                }
            }
        };
    })();

    // Модуль для работы с UI
    const UIModule = (function() {
        const selectors = {
            poemsList: '#poems',
            poemForm: '#poemForm',
            inputs: {
                title: '#poemTitle',
                content: '#poemContent',
                author: '#authorName'
            }
        };
        
        const createPoemElement = (poem, index) => {
            const article = document.createElement('article');
            article.className = 'poem fade-in';
            article.innerHTML = `
                <header class="poem__header">
                    <h2 class="poem__title">${escapeHtml(poem.title)}</h2>
                    <button class="btn btn--danger" data-action="delete" data-index="${index}">
                        Удалить
                    </button>
                </header>
                <div class="poem__content">${escapeHtml(poem.content)}</div>
                <footer class="poem__footer">
                    <span>Автор: ${escapeHtml(poem.author)}</span>
                    <time>${formatDate(poem.date)}</time>
                </footer>
            `;
            return article;
        };
        
        const formatDate = date => {
            return new Date(date).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };
        
        const escapeHtml = unsafe => {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        };

        return {
            selectors,
            
            displayPoems(poems) {
                const container = document.querySelector(selectors.poemsList);
                container.innerHTML = '';
                poems.forEach((poem, index) => {
                    container.appendChild(createPoemElement(poem, index));
                });
            },
            
            getFormData() {
                return {
                    title: document.querySelector(selectors.inputs.title).value,
                    content: document.querySelector(selectors.inputs.content).value,
                    author: document.querySelector(selectors.inputs.author).value
                };
            },
            
            clearForm() {
                document.querySelector(selectors.poemForm).reset();
            },
            
            showNotification(message, type = 'success') {
                const toast = document.createElement('div');
                toast.className = `toast toast--${type}`;
                toast.textContent = message;
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    toast.style.animation = 'slideOut 0.3s ease-in forwards';
                    setTimeout(() => toast.remove(), 300);
                }, 3000);
            }
        };
    })();

    // Контроллер приложения
    const App = (function(DataModule, UIModule) {
        let poems = [];
        
        const bindEvents = () => {
            // Обработка отправки формы
            document.querySelector(UIModule.selectors.poemForm)
                .addEventListener('submit', handleSubmit);
            
            // Делегирование событий для кнопок удаления
            document.querySelector(UIModule.selectors.poemsList)
                .addEventListener('click', handlePoemAction);
            
            // Обработка навигации
            document.querySelectorAll('.nav__link')
                .forEach(link => link.addEventListener('click', handleNavigation));
        };
        
        const handleSubmit = (e) => {
            e.preventDefault();
            
            try {
                const formData = UIModule.getFormData();
                
                // Валидация данных
                if (!validatePoemData(formData)) {
                    throw new Error('Пожалуйста, заполните все поля корректно');
                }
                
                const newPoem = {
                    ...formData,
                    date: new Date().toISOString(),
                    id: generateUniqueId()
                };
                
                poems.unshift(newPoem);
                
                if (DataModule.save(poems)) {
                    UIModule.clearForm();
                    UIModule.displayPoems(poems);
                    UIModule.showNotification('Стихотворение успешно опубликовано');
                }
            } catch (error) {
                UIModule.showNotification(error.message, 'error');
            }
        };
        
        const handlePoemAction = (e) => {
            const button = e.target.closest('[data-action="delete"]');
            if (!button) return;
            
            const index = parseInt(button.dataset.index);
            if (confirm('Вы уверены, что хотите удалить это стихотворение?')) {
                poems.splice(index, 1);
                DataModule.save(poems);
                UIModule.displayPoems(poems);
                UIModule.showNotification('Стихотворение удалено');
            }
        };
        
        const handleNavigation = (e) => {
            e.preventDefault();
            const section = e.target.dataset.section;
            document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
            document.getElementById(section).classList.remove('hidden');
        };
        
        const validatePoemData = (data) => {
            return data.title.length >= 2 && 
                   data.content.length >= 10 && 
                   data.author.length >= 2;
        };
        
        const generateUniqueId = () => {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        };
        
        return {
            init() {
                poems = DataModule.load();
                UIModule.displayPoems(poems);
                bindEvents();
            }
        };
    })(DataModule, UIModule);

    // Инициализация приложения
    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });