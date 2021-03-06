//Bookmarks button before AddressBar
//Кнопка с выпадающими закладками перед строкой адреса

{
    const position = { separate: "separate", addressfield: "addressfield" }

    vivaldi.jdhooks.hookModule("vivaldiSettings", (moduleInfo, exports) => {
        let oldGetDefault = exports.getDefault
        exports.getDefault = name => {
            switch (name) {
                case "BOOKMARK_BUTTON_POSITION": return position.separate
                default: return oldGetDefault(name)
            }
        }
        return exports
    })

    function bookmarksOnClick(event) {
        const CommandManager = vivaldi.jdhooks.require("_CommandManager")
        const ShowMenu = vivaldi.jdhooks.require("_ShowMenu")

        let menu = CommandManager.getNamedMenu("vivaldi", true)
        if (!menu.length) menu = CommandManager.getNamedMenu("menubar", true)

        let idx = menu.findIndex(i => i.labelEnglish == "Bookmarks")
        if (idx > -1) {
            const rect = event.target.getBoundingClientRect()
            const props = {
                id: 0,
                rect: {
                    x: parseInt(rect.left),
                    y: parseInt(rect.top),
                    width: parseInt(rect.width),
                    height: parseInt(rect.height)
                },
                menu: { items: menu[idx].items }
            }
            ShowMenu.show(props.id, [props], "bottom")
        }
    }

    vivaldi.jdhooks.hookClass("createbookmark_createbookmark", origClass => {
        const ReactDom = vivaldi.jdhooks.require("ReactDOM")

        class newCreateBookmarkButton extends origClass {
            pointerUp(e) {
                if (e.button == 2 && this.state.jdVivaldiSettings.BOOKMARK_BUTTON_POSITION == position.addressfield) {
                    bookmarksOnClick(e)
                }
            }

            componentDidMount() {
                if (super.componentDidMount) super.componentDidMount()

                const button = ReactDom.findDOMNode(this)
                if (button) button.addEventListener("pointerup", this.pointerUp.bind(this), true)
            }

            componentWillUnmount() {
                const button = ReactDom.findDOMNode(this)
                if (button) button.removeEventListener("pointerup", this.pointerUp, true)

                if (super.componentWillUnmount) super.componentWillUnmount()
            }
        }
        return vivaldi.jdhooks.insertWatcher(newCreateBookmarkButton, { settings: ["BOOKMARK_BUTTON_POSITION"] })
    })

    vivaldi.jdhooks.hookClass("toolbars_Toolbar", origClass => {
        const React = vivaldi.jdhooks.require("React")
        const SettingsPaths = vivaldi.jdhooks.require("_PrefKeys")
        const ToolbarButton = vivaldi.jdhooks.require("toolbars_ToolbarButton")

        class newClass extends origClass {
            render() {
                //TODO: remove in the future
                const VIVALDI_MENU_POSITION = this.state.jdVivaldiSettings.VIVALDI_MENU_POSITION || this.state.jdPrefs[SettingsPaths.kMenuDisplay]

                let ret = super.render()
                if (this.props.name == SettingsPaths.kToolbarsNavigation) {
                    ret.props.children.push(
                        this.state.jdVivaldiSettings.BOOKMARK_BUTTON_POSITION == position.separate &&
                            VIVALDI_MENU_POSITION != "top"

                            ? React.createElement(ToolbarButton, {
                                tooltip: "Bookmarks",
                                onClick: bookmarksOnClick,
                                image: vivaldi.jdhooks.require("_svg_bookmarks_large")
                            })

                            : null
                    )
                }
                return ret
            }
        }
        return vivaldi.jdhooks.insertWatcher(newClass, {
            settings: ["BOOKMARK_BUTTON_POSITION",
                "VIVALDI_MENU_POSITION" //TODO: remove in the future
            ],
            prefs: [SettingsPaths.kMenuDisplay]
        })
    })

    vivaldi.jdhooks.hookClass("settings_bookmarks_BookmarkSettings", origClass => {
        const React = vivaldi.jdhooks.require("React")
        const RadioGroup = vivaldi.jdhooks.require("common_RadioGroup")
        const VivaldiSettings = vivaldi.jdhooks.require("vivaldiSettings")
        const Settings_SettingsSearchCategoryChild = vivaldi.jdhooks.require("settings_SettingsSearchCategoryChild")

        function toArray(i) {
            if (Array.isArray(i)) return i;
            return [i];
        }

        const Setting = vivaldi.jdhooks.insertWatcher(class extends React.PureComponent {
            render() {
                return React.createElement(Settings_SettingsSearchCategoryChild, { filter: this.props.filter },
                    React.createElement("div", { className: "setting-group" },
                        React.createElement("h3", {}, "Bookmark Button"),
                        React.createElement(RadioGroup,
                            {
                                name: "bookmark_bar_display",
                                value: this.state.jdVivaldiSettings.BOOKMARK_BUTTON_POSITION,
                                onChange: (evt) => VivaldiSettings.set({ BOOKMARK_BUTTON_POSITION: evt.target.value })
                            },
                            React.createElement("div", { className: "setting-single" },
                                React.createElement("label", {},
                                    React.createElement("input",
                                        {
                                            type: "radio",
                                            value: position.separate,
                                        }),
                                    React.createElement("span", {}, "Separate button")
                                )
                            ),
                            React.createElement("div", { className: "setting-single" },
                                React.createElement("label", {},
                                    React.createElement("input",
                                        {
                                            type: "radio",
                                            value: position.addressfield,
                                        }),
                                    React.createElement("span", {},
                                        'Right click on "Add bookmark" button in the address field'
                                    )
                                )
                            )
                        )
                    )
                )
            }
        }, { settings: ["BOOKMARK_BUTTON_POSITION"] })

        return class extends origClass {
            render() {
                let r = super.render()
                r.props.children = toArray(r.props.children)
                r.props.children.push(React.createElement(Setting, this.props))
                return r
            }
        }
    })
}