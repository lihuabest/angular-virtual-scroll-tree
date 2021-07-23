import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import {
  FileFlatNode,
  FileNode,
  tool_treesPositions,
  VirtualScrollTreeComponent,
} from './components/virtual-scroll-tree/virtual-scroll-tree.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  fullDatasource = [] as Array<any>;

  isVisible = false;
  name: string | null = null;
  editType: 'add' | 'update' = 'add';

  isVisibleOrg = false;
  // @ts-ignore
  currentOrg: FileNode | null;
  // @ts-ignore
  selectParentOrg: FileNode | null;
  // @ts-ignore
  selectParentOrgOld: FileNode | null;

  // @ts-ignore
  @ViewChild('virtualScrollTree') virtualScrollTree: VirtualScrollTreeComponent;

  constructor(private cdf: ChangeDetectorRef) {}

  ngOnInit() {
    let getData = () => {
      return {
        name: '',
        children: [
          {
            name: 'apple',
            type: '1',
            children: [
              { name: 'apple-1', type: '1-1' },
              { name: 'apple-2', type: '1-2' },
            ],
          },
          {
            name: 'apple1',
            type: '2',
            children: [{ name: 'apple-12', type: '1-12' }],
          },
          {
            name: 'apple2',
            type: '3',
            children: [
              { name: 'apple-12', type: '1-12' },
              { name: 'apple-34', type: '1-12' },
              {
                name: 'apple-53',
                type: '1-12',
                children: [{ name: '123' }, { name: '123' }],
              },
            ],
          },
        ],
      };
    };

    this.fullDatasource = new Array(200000).fill({}).map((item, index) => {
      let data = getData();
      return { ...data, name: 'index ' + (index + 1) };
    });
  }

  /**
   * 新增、编辑节点
   * @param node
   * @param type
   */
  editClick(node: FileNode, type: any) {
    this.editType = type;
    if (this.editType === 'update') {
      this.name = node.name || '';
      this.currentOrg = node; // 编辑的当前节点

      // 拿当前节点的上级节点
      let pathNodes = tool_treesPositions(this.fullDatasource, node);
      if (pathNodes.length > 1) {
        this.selectParentOrg = pathNodes[pathNodes.length - 2];
        this.selectParentOrgOld = this.selectParentOrg; // 这里把原始记录保存一下 可能进行移动操作
      }
    }
    this.isVisible = true;

    this.cdf.detectChanges();
  }

  deleteClick(node: FileNode) {
    // 直接调用组件方法
    this.virtualScrollTree.deleteNode(node);
    this.fullDatasource = this.fullDatasource.concat([]);
    this.cdf.detectChanges();
  }

  handleCancel() {
    this.name = null;
    this.selectParentOrg = null;
    this.selectParentOrgOld = null;
    this.isVisible = false;

    this.cdf.detectChanges();
  }

  handleOk() {
    if (this.name && this.selectParentOrg) {
      // 新增
      if (this.editType === 'add') {
        this.selectParentOrg.children = this.selectParentOrg.children || [];
        this.selectParentOrg.children.push({
          name: this.name,
        });
        this.fullDatasource = this.fullDatasource.concat([]);
      }
      // 更新
      if (this.editType === 'update') {
        if (this.currentOrg) {
          this.currentOrg.name = this.name;
        }
        // 更新位置
        if (this.selectParentOrg !== this.selectParentOrgOld) {
          this.virtualScrollTree.moveNode(
            this.currentOrg as FileNode,
            this.selectParentOrg
          );
        }
        this.fullDatasource = this.fullDatasource.concat([]);
      }

      this.handleCancel();
    }
  }

  selectOrgClick() {
    this.isVisibleOrg = true;

    this.cdf.detectChanges();
  }

  handleOrgCancel() {
    this.isVisibleOrg = false;

    this.cdf.detectChanges();
  }

  handleOrgOk() {
    this.handleOrgCancel();
  }

  onSelectedOriginNodeEvent(node: FileNode) {
    this.selectParentOrg = node;
  }
}
