let tabAction = 0;
let contextMenu = 0;

async function reloadTabIcons() {
    let tabs = await browser.tabs.query({currentWindow: true, pinned: true});

    let ul = document.getElementById('tablist');
    while (ul.childNodes.length > 0) {
        ul.removeChild(ul.firstChild);
    }

    let dragElement = null;
    
    for (let i = 0; i < tabs.length; i++) {
        let li = document.createElement('li');

        if (tabs[i].mutedInfo.muted) {
            li.classList.add('muted');
            li.setAttribute('data-muted', true)
        }

        if (tabs[i].active) {
            li.classList.add('active');
        }

        if (tabs[i].attention || tabs[i].title.charAt(0) == '(' || tabs[i].title.charAt(tabs[i].title.length-1) == ')') {
            li.classList.add('attention');
        }

        let img = document.createElement('img');
        img.src = tabs[i].favIconUrl;
                
        li.appendChild(img);
        li.setAttribute('data-id', tabs[i].id);
        li.setAttribute('draggable', true);
        li.addEventListener('click', function() {
            let activeTabs = document.getElementsByClassName('active');
            if (activeTabs[0]) {
                activeTabs[0].classList.remove('active');
            }
            this.classList.add('active')

            browser.tabs.update(parseInt(this.getAttribute('data-id')), {
                active: true
            });

        });

        li.addEventListener('contextmenu', function(event) {
            event.preventDefault();
            tabAction = parseInt(this.getAttribute('data-id'));
            let tabMuted = this.hasAttribute('data-muted')
            document.getElementById('mute').style.display = tabMuted ? 'none' : 'block';
            document.getElementById('unmute').style.display = tabMuted ? 'block' : 'none';
            contextMenu.style.left = '0.2em'
            contextMenu.style.top = event.clientY + 'px';
            contextMenu.classList.add('active');
        })

        li.addEventListener('dragstart', function(event) {
            dragElement = this;
        });

        li.addEventListener('dragover', function(event) {
            if (this === dragElement) {
                return;
            } 

            const thisIdx = [...ul.children].indexOf(this)
            const dragElementIdx = [...ul.children].indexOf(dragElement)
            
            // If the hovered element is above the dragged element
            if (thisIdx < dragElementIdx) {
                // Place the dragged element before the hovered element
                this.parentNode.insertBefore(dragElement, this)
            } else {
                // Place the dragged element after the hovered element
                this.parentNode.insertBefore(dragElement, this.nextSibling)
            }

            for (let i = 0; i < ul.childNodes.length; i++) {
                let tabId = parseInt(ul.childNodes[i].getAttribute('data-id'));

                browser.tabs.move(tabId, {index: i})
            }

        });

        ul.appendChild(li);
    }
}
async function start() {
    reloadTabIcons();
    browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tabInfo) {
        if (changeInfo.title || changeInfo.active || changeInfo.pinned == true || changeInfo.muted || changeInfo.attention) {
            reloadTabIcons();
        }
    });


    browser.tabs.onActivated.addListener(async function(info) {
        const tabId = info.tabId
        let tab = await browser.tabs.get(info.tabId)

        let activeEl = document.querySelector('li.active')
        if (activeEl) {
            activeEl.classList.remove('active')
        }

        if (tab.pinned) {
            const el = document.querySelector(`li[data-id="${tabId}"]`)
            el.classList.add('active')
        }
    });

    contextMenu = document.getElementById('menu');

    document.getElementById('unpin').addEventListener('click', function() {
        browser.tabs.update(tabAction, {
                pinned: false
        });
        reloadTabIcons();
    });

    document.getElementById('close').addEventListener('click', function() {
        browser.tabs.remove(tabAction);
        reloadTabIcons();
    });

    document.getElementById('mute').addEventListener('click', function() {
        browser.tabs.update(tabAction, {
            muted: true
        });
        reloadTabIcons();
    });

    document.getElementById('unmute').addEventListener('click', function() {
        browser.tabs.update(tabAction, {
            muted: false
        });
        reloadTabIcons();
    });


    document.addEventListener('click', function() {
        contextMenu.classList.remove('active');
    });
}


document.addEventListener('contextmenu', event => event.preventDefault());

document.addEventListener('DOMContentLoaded', function() {
    start();
});

