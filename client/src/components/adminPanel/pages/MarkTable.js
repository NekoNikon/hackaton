import { Table, Tag, Space } from 'antd';

const columns = [
  {
    title: 'Предмет',
    dataIndex: 'subject',
    key: 'Предмет',
    render: text => <a>{text}</a>,
  },
  {
    title: 'mark',
    dataIndex: 'mark',
    key: 'Оценка',
  }
];

const data = [
  {
    key: '1',
    subject: 'Казахский яызк',
    mark: '5'
 },
  {
    key: '2',
    subject: 'Русский язык',
    mark: '5'
  },
  {
    key: '3',
    subject: 'Математика',
    mark: '4'
  },
  {
    key: '4',
    subject: 'Физика',
    mark: '4'
  },
  {
    key: '5',
    subject: 'Биология',
    mark: '4'
  },
  {
    key: '6',
    subject: 'География',
    mark: '5'
  },
];

let MarkTable = (props) => {
    return (
        <Table pagination={false} columns={columns} dataSource={data}/>
    )
}

export default MarkTable