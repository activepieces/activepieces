export const NodeService = {
  getTreeNodesData() {
    return [
      {
        key: '0',
        label: 'Documents',
        data: 'Documents Folder',
        icon: 'pi pi-fw pi-inbox',
        children: [
          {
            key: '0-0',
            label: 'Work',
            data: 'Work Folder',
            icon: 'pi pi-fw pi-cog',
            children: [
              {
                key: '0-0-0',
                label: 'Expenses.doc',
                icon: 'pi pi-fw pi-file',
                data: 'Expenses Document',
              },
              {
                key: '0-0-1',
                label: 'Resume.doc',
                icon: 'pi pi-fw pi-file',
                data: 'Resume Document',
              },
            ],
          },
          {
            key: '0-1',
            label: 'Home',
            data: 'Home Folder',
            icon: 'pi pi-fw pi-home',
            children: [
              {
                key: '0-1-0',
                label: 'Invoices.txt',
                icon: 'pi pi-fw pi-file',
                data: 'Invoices for this month',
              },
            ],
          },
        ],
      },
      {
        key: '1',
        label: 'Events',
        data: 'Events Folder',
        icon: 'pi pi-fw pi-calendar',
        children: [
          {
            key: '1-0',
            label: 'Meeting',
            icon: 'pi pi-fw pi-calendar-plus',
            data: 'Meeting',
          },
          {
            key: '1-1',
            label: 'Product Launch',
            icon: 'pi pi-fw pi-calendar-plus',
            data: 'Product Launch',
          },
          {
            key: '1-2',
            label: 'Report Review',
            icon: 'pi pi-fw pi-calendar-plus',
            data: 'Report Review',
          },
        ],
      },
      {
        key: '2',
        label: 'Movies',
        data: 'Movies Folder',
        icon: 'pi pi-fw pi-star-fill',
        children: [
          {
            key: '2-0',
            icon: 'pi pi-fw pi-star-fill',
            label: 'Al Pacino',
            data: 'Pacino Movies',
            children: [
              {
                key: '2-0-0',
                label: 'Scarface',
                icon: 'pi pi-fw pi-video',
                data: 'Scarface Movie',
              },
              {
                key: '2-0-1',
                label: 'Serpico',
                icon: 'pi pi-fw pi-video',
                data: 'Serpico Movie',
              },
            ],
          },
          {
            key: '2-1',
            label: 'Robert De Niro',
            icon: 'pi pi-fw pi-star-fill',
            data: 'De Niro Movies',
            children: [
              {
                key: '2-1-0',
                label: 'Goodfellas',
                icon: 'pi pi-fw pi-video',
                data: 'Goodfellas Movie',
              },
              {
                key: '2-1-1',
                label: 'Untouchables',
                icon: 'pi pi-fw pi-video',
                data: 'Untouchables Movie',
              },
            ],
          },
        ],
      },
    ];
  },

  getTreeTableNodesData() {
    return [
      {
        key: '0',
        data: {
          name: 'Applications',
          size: '100kb',
          type: 'Folder',
        },
        children: [
          {
            key: '0-0',
            data: {
              name: 'React',
              size: '25kb',
              type: 'Folder',
            },
            children: [
              {
                key: '0-0-0',
                data: {
                  name: 'react.app',
                  size: '10kb',
                  type: 'Application',
                },
              },
              {
                key: '0-0-1',
                data: {
                  name: 'native.app',
                  size: '10kb',
                  type: 'Application',
                },
              },
              {
                key: '0-0-2',
                data: {
                  name: 'mobile.app',
                  size: '5kb',
                  type: 'Application',
                },
              },
            ],
          },
          {
            key: '0-1',
            data: {
              name: 'editor.app',
              size: '25kb',
              type: 'Application',
            },
          },
          {
            key: '0-2',
            data: {
              name: 'settings.app',
              size: '50kb',
              type: 'Application',
            },
          },
        ],
      },
      {
        key: '1',
        data: {
          name: 'Cloud',
          size: '20kb',
          type: 'Folder',
        },
        children: [
          {
            key: '1-0',
            data: {
              name: 'backup-1.zip',
              size: '10kb',
              type: 'Zip',
            },
          },
          {
            key: '1-1',
            data: {
              name: 'backup-2.zip',
              size: '10kb',
              type: 'Zip',
            },
          },
        ],
      },
      {
        key: '2',
        data: {
          name: 'Desktop',
          size: '150kb',
          type: 'Folder',
        },
        children: [
          {
            key: '2-0',
            data: {
              name: 'note-meeting.txt',
              size: '50kb',
              type: 'Text',
            },
          },
          {
            key: '2-1',
            data: {
              name: 'note-todo.txt',
              size: '100kb',
              type: 'Text',
            },
          },
        ],
      },
      {
        key: '3',
        data: {
          name: 'Documents',
          size: '75kb',
          type: 'Folder',
        },
        children: [
          {
            key: '3-0',
            data: {
              name: 'Work',
              size: '55kb',
              type: 'Folder',
            },
            children: [
              {
                key: '3-0-0',
                data: {
                  name: 'Expenses.doc',
                  size: '30kb',
                  type: 'Document',
                },
              },
              {
                key: '3-0-1',
                data: {
                  name: 'Resume.doc',
                  size: '25kb',
                  type: 'Resume',
                },
              },
            ],
          },
          {
            key: '3-1',
            data: {
              name: 'Home',
              size: '20kb',
              type: 'Folder',
            },
            children: [
              {
                key: '3-1-0',
                data: {
                  name: 'Invoices',
                  size: '20kb',
                  type: 'Text',
                },
              },
            ],
          },
        ],
      },
      {
        key: '4',
        data: {
          name: 'Downloads',
          size: '25kb',
          type: 'Folder',
        },
        children: [
          {
            key: '4-0',
            data: {
              name: 'Spanish',
              size: '10kb',
              type: 'Folder',
            },
            children: [
              {
                key: '4-0-0',
                data: {
                  name: 'tutorial-a1.txt',
                  size: '5kb',
                  type: 'Text',
                },
              },
              {
                key: '4-0-1',
                data: {
                  name: 'tutorial-a2.txt',
                  size: '5kb',
                  type: 'Text',
                },
              },
            ],
          },
          {
            key: '4-1',
            data: {
              name: 'Travel',
              size: '15kb',
              type: 'Text',
            },
            children: [
              {
                key: '4-1-0',
                data: {
                  name: 'Hotel.pdf',
                  size: '10kb',
                  type: 'PDF',
                },
              },
              {
                key: '4-1-1',
                data: {
                  name: 'Flight.pdf',
                  size: '5kb',
                  type: 'PDF',
                },
              },
            ],
          },
        ],
      },
      {
        key: '5',
        data: {
          name: 'Main',
          size: '50kb',
          type: 'Folder',
        },
        children: [
          {
            key: '5-0',
            data: {
              name: 'bin',
              size: '50kb',
              type: 'Link',
            },
          },
          {
            key: '5-1',
            data: {
              name: 'etc',
              size: '100kb',
              type: 'Link',
            },
          },
          {
            key: '5-2',
            data: {
              name: 'var',
              size: '100kb',
              type: 'Link',
            },
          },
        ],
      },
      {
        key: '6',
        data: {
          name: 'Other',
          size: '5kb',
          type: 'Folder',
        },
        children: [
          {
            key: '6-0',
            data: {
              name: 'todo.txt',
              size: '3kb',
              type: 'Text',
            },
          },
          {
            key: '6-1',
            data: {
              name: 'logo.png',
              size: '2kb',
              type: 'Picture',
            },
          },
        ],
      },
      {
        key: '7',
        data: {
          name: 'Pictures',
          size: '150kb',
          type: 'Folder',
        },
        children: [
          {
            key: '7-0',
            data: {
              name: 'barcelona.jpg',
              size: '90kb',
              type: 'Picture',
            },
          },
          {
            key: '7-1',
            data: {
              name: 'primeng.png',
              size: '30kb',
              type: 'Picture',
            },
          },
          {
            key: '7-2',
            data: {
              name: 'prime.jpg',
              size: '30kb',
              type: 'Picture',
            },
          },
        ],
      },
      {
        key: '8',
        data: {
          name: 'Videos',
          size: '1500kb',
          type: 'Folder',
        },
        children: [
          {
            key: '8-0',
            data: {
              name: 'primefaces.mkv',
              size: '1000kb',
              type: 'Video',
            },
          },
          {
            key: '8-1',
            data: {
              name: 'intro.avi',
              size: '500kb',
              type: 'Video',
            },
          },
        ],
      },
    ];
  },

  getTreeTableNodes() {
    return Promise.resolve(this.getTreeTableNodesData());
  },

  getTreeNodes() {
    return Promise.resolve(this.getTreeNodesData());
  },
};
