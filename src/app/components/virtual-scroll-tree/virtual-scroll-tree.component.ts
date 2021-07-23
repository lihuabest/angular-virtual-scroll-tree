import { ListRange, SelectionModel } from '@angular/cdk/collections';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { FlatTreeControl } from '@angular/cdk/tree';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { Observable, of as observableOf } from 'rxjs';

export class FileNode {
  children?: FileNode[];
  name?: string;
  checked?: boolean; // 选中
  expanded?: boolean; // 展开
  selected?: boolean; // 点击选择
  lastData?: boolean; // 是否是最后一个列表元素
}

export class FileFlatNode {
  constructor(
    public expandable: boolean,
    public name: string,
    public level: number,
    public checked: any,
    public originNode: any // 节点原始数据
  ) {}
}

/**
 * 获取32位uuid
 * @param len 长度
 * @param radix 基数
 * @returns {string}
 */
export function tool_getUuid(len = 32, radix?: any) {
  let chars =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
  let uuid = [],
    i;
  radix = radix || chars.length;

  if (len) {
    for (i = 0; i < len; i++) {
      uuid[i] = chars[0 | (Math.random() * radix)];
    }
  } else {
    let r;
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
    uuid[14] = '4';
    for (i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | (Math.random() * 16);
        uuid[i] = chars[i === 19 ? (r & 0x3) | 0x8 : r];
      }
    }
  }

  return uuid.join('');
}

/**
 * 树形初始化 配置参数
 */
export interface TreesConfig {
  callback?: Function; // 每成功初始化一个数据 回调一次
  pid?: string | 'pid'; // pid label
  id?: string | 'id'; // id label
  children?: string | 'children'; // children label
  topValue?: string | '0'; // 跟id的值
  container?: any; // 接受树形结构的数组
  isShift?: boolean;
}

/**
 * 树形节点遍历
 * @param trees
 * @param {TreesConfig} options
 */
export function tool_treesTraverse(trees: any, options?: TreesConfig | any) {
  options.children = options.children || 'children';

  let temp = [].concat(trees),
    tem: any;
  // 从上往下
  while (temp.length) {
    if (options.isShift) {
      tem = temp.shift(); // 从前..
    } else {
      tem = temp.pop(); // 从后往前
    }
    options.callback && options.callback(tem);

    if (tem[options.children] && tem[options.children].length) {
      temp = temp.concat(tem[options.children]);
    }
  }
}

/**
 * 在树形里搜索指定节点，并返回节点的父节点集合
 * 根据当前选中节点 查找父节点
 * http://www.cnblogs.com/lycnblogs/archive/2017/05/18/6874389.html 具体查找算法看这篇文章
 * @param trees
 * @param tree
 */
export function tool_treesPositions(
  trees: any,
  tree: any,
  option: TreesConfig = {}
) {
  option.children = option.children || 'children';

  let temp = [] as Array<any>;

  try {
    let getNode = (node: any) => {
      temp.push(node);

      if (node === tree) {
        throw Error('GOT IT!');
      }
      if (
        node[option.children || 'children'] &&
        node[option.children || 'children'].length
      ) {
        node[option.children || 'children'].forEach((n: any) => {
          getNode(n);
        });
        temp.pop();
      } else {
        temp.pop();
      }
    };

    trees.forEach((t: any) => {
      getNode(t);
    });

    return [];
  } catch (e) {
    return temp;
  }
}

@Component({
  selector: 'app-virtual-scroll-tree',
  templateUrl: './virtual-scroll-tree.component.html',
  styleUrls: ['./virtual-scroll-tree.component.scss'],
})
export class VirtualScrollTreeComponent implements AfterViewInit, OnChanges {
  @Input() itemSize = 48;
  // 全局数据
  @Input() fullDatasource = [] as Array<any>;
  // 是否可以选择
  @Input() checkedable = false;
  // 可选择数据
  @Output() checklistSelectionEvent = new EventEmitter();
  // 自定义内容是hover展示方式 还是inline展示方式
  @Input() treeNodeTemplateStyle: 'hover' | 'inline' = 'hover';
  // icon类型
  @Input() iconType: 'folder' | 'arrow' = 'arrow';
  // 是否展示树形线
  @Input() showLine = true;
  // 当前点击选择的节点
  // @ts-ignore
  selectedOriginNode: FileNode;
  // 当前节点点击数据
  @Output() selectedOriginNodeEvent = new EventEmitter();

  treeControl: FlatTreeControl<FileFlatNode>;
  treeFlattener: MatTreeFlattener<FileNode, FileFlatNode>;
  dataSource: MatTreeFlatDataSource<FileNode, FileFlatNode>;
  checklistSelection = new SelectionModel<FileNode>(true /* multiple */);

  @ViewChild(CdkVirtualScrollViewport)
  virtualScroll!: CdkVirtualScrollViewport;

  @ContentChild('treeNodeTemplate', { static: false })
  // @ts-ignore
  treeNodeTemplate: TemplateRef<any>;

  constructor(private cdf: ChangeDetectorRef) {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      this._getLevel,
      this._isExpandable,
      this._getChildren
    );
    this.treeControl = new FlatTreeControl<FileFlatNode>(
      this._getLevel,
      this._isExpandable
    );
    this.dataSource = new MatTreeFlatDataSource(
      this.treeControl,
      this.treeFlattener
    );

    // tool_treesTraverse(this.fullDatasource, {
    //   callback: (leaf: any) => {
    //     if (leaf.children) {
    //       leaf.children.forEach((child: any) => {
    //         child.parent = leaf; // 格式化数据 绑定数据的父级
    //       });
    //     }
    //   },
    // });
  }

  transformer = (node: FileNode, level: number) => {
    return new FileFlatNode(
      node.children && node.children.length ? true : false,
      node.name || '',
      level,
      node.checked,
      node
    );
  };

  private _getLevel = (node: FileFlatNode) => node.level;

  private _isExpandable = (node: FileFlatNode) => node.expandable;

  private _getChildren = (node: FileNode): Observable<FileNode[]> =>
    observableOf(node.children || []);

  hasChild = (_: number, _nodeData: FileFlatNode) => _nodeData.expandable;

  ngAfterViewInit() {
    this.virtualScroll.renderedRangeStream.subscribe((range) => {
      this.dataSource.data = this.fullDatasource.slice(range.start, range.end);

      this.treeControl.dataNodes.forEach((node: FileFlatNode) => {
        if (node.originNode.expanded) {
          this.treeControl.expand(node);
        }
      });

      this.initDataLast();
    });
  }

  ngOnChanges(change: SimpleChanges) {
    // 检测总数据变化
    if (change && change.fullDatasource) {
      this.dataSource.data = this.fullDatasource.slice(0, 10);

      this.treeControl.dataNodes.forEach((node: FileFlatNode) => {
        if (node.originNode.expanded) {
          this.treeControl.expand(node);
        }
      });

      this.initDataLast();
    }
  }

  scrollToIndex(index: number) {
    // 先滚动到指定位置
    this.virtualScroll.scrollToIndex(index);

    // 再替换数据
    this.dataSource.data = this.fullDatasource.slice(index, index + 10);

    this.treeControl.dataNodes.forEach((node: FileFlatNode) => {
      if (node.originNode.expanded) {
        this.treeControl.expand(node);
      }
    });

    this.initDataLast();
  }

  /**
   * 判定节点的连线
   */
  initDataLast() {
    if (this.showLine) {
      let data = this.dataSource.data;

      tool_treesTraverse(data, {
        callback: (leaf: any) => {
          if (leaf.children && leaf.children.length) {
            leaf.children.forEach((child: any) => {
              delete child.lastData;
              delete child.last;
            });
            // 找到每次渲染元素的所以列表的最后一个元素 添加一个last标识
            leaf.children[leaf.children.length - 1].last = true;
          }
        },
      });

      let lastData = data[data.length - 1];
      if (lastData === this.fullDatasource[this.fullDatasource.length - 1]) {
        // 如果最后一个元素是全部元素的最后一个 表示数据展示到最后了
        if (lastData.children && lastData.children.length) {
          lastData.children[lastData.children.length - 1].lastData = true;

          // 最后一个元素的子元素里的最后一个子元素 里的内容 全部
          tool_treesTraverse(
            lastData.children[lastData.children.length - 1].children || [],
            {
              callback: (leaf: any) => {
                leaf.lastData = true;
              },
            }
          );
        }
      }
    }
  }

  /**
   * 展开、关闭节点
   * @param node
   */
  expandClick(node: FileFlatNode) {
    node.originNode.expanded = !node.originNode.expanded;
  }

  /**
   * 节点单选切换
   * @param node
   */
  todoLeafItemSelectionToggle(node: FileFlatNode): void {
    this.checklistSelection.toggle(node.originNode); // 这里是存储原始数据
    let nodeSelected = this.checklistSelection.isSelected(node.originNode); // 拿到是否选中标识

    // 改变子元素的状态
    tool_treesTraverse(node.originNode.children || [], {
      callback: (leaf: FileNode) => {
        if (nodeSelected) {
          this.checklistSelection.select(leaf);
        } else {
          this.checklistSelection.deselect(leaf);
        }
      },
    });

    let pathNodes = tool_treesPositions(this.fullDatasource, node.originNode);
    if (pathNodes.length > 1) {
      pathNodes.pop(); // 不要最后一个元素 最后一个元素就是当前点击节点数据
      for (let i = pathNodes.length - 1; i >= 0; i--) {
        if (
          pathNodes[i] &&
          pathNodes[i].children.every((child: FileNode) => {
            return this.checklistSelection.isSelected(child);
          })
        ) {
          this.checklistSelection.select(pathNodes[i]);
        } else {
          this.checklistSelection.deselect(pathNodes[i]);
        }
      }
    }

    // 把选择数据发送到父组件
    this.checklistSelectionEvent.emit(this.checklistSelection);

    this.cdf.detectChanges();
  }

  /**
   * 判定节点是否半选中
   * @param node
   * @returns
   */
  descendantsPartiallySelected(node: FileFlatNode): boolean {
    if (this.checklistSelection.isSelected(node.originNode)) {
      return false;
    } else if (
      node.originNode.children &&
      node.originNode.children.some((child: FileNode) => {
        return this.checklistSelection.isSelected(child);
      })
    ) {
      return true;
    }

    return false;
  }

  /**
   * 节点名称点击 会高亮选中节点
   * @param node
   */
  nameClick(node: FileFlatNode) {
    if (!this.selectedOriginNode) {
      this.selectedOriginNode = node.originNode;
      node.originNode.selected = true;

      // 发送父元素选中数据
      this.selectedOriginNodeEvent.emit(node.originNode);
    } else if (this.selectedOriginNode !== node.originNode) {
      // @ts-ignore
      this.selectedOriginNode.selected = false;
      this.selectedOriginNode = node.originNode;
      node.originNode.selected = true;

      this.selectedOriginNodeEvent.emit(node.originNode);
    }

    this.cdf.detectChanges();
  }

  /**
   * 节点删除
   * @param node
   */
  deleteNode(node: FileNode) {
    let pathNodes = tool_treesPositions(this.fullDatasource, node);
    if (pathNodes.length === 1) {
      this.fullDatasource = this.fullDatasource.filter(
        (data: FileNode) => data !== node
      );
    } else if (pathNodes.length > 1) {
      pathNodes[pathNodes.length - 2].children = pathNodes[
        pathNodes.length - 2
      ].children.filter((data: FileNode) => {
        return data !== node;
      });
    }
  }

  /**
   * 节点移动
   * @param node
   * @param parentNode
   */
  moveNode(node: FileNode, parentNode: FileNode) {
    this.deleteNode(node);

    parentNode.children = parentNode.children || [];
    parentNode.children.push(node);

    let pathNodes = tool_treesPositions(this.fullDatasource, parentNode);

    for (let i = 0; i < this.fullDatasource.length; i++) {
      this.fullDatasource[i].expanded = false;
      if (this.fullDatasource[i] === pathNodes[0]) {
        this.scrollToIndex(i);
        break;
      }
    }
    pathNodes.forEach((node) => {
      node.expanded = true;
    });
  }
}
