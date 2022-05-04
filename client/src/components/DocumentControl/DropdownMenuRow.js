import { Menu, Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';



let DropdownMenuRow = (props) => {
    const menu = (
        <Menu onClick={props.onClick} >
            <Menu.Item key="0">
                <a target="_blank" rel="noopener noreferrer">
                    Преподаватель информатики
                </a>
            </Menu.Item>
            <Menu.Item key="1">
                <a target="_blank" rel="noopener noreferrer">
                    Архитектор ПО
                </a>
            </Menu.Item>
            <Menu.Item key="2" >
            <a target="_blank" rel="noopener noreferrer">
                    Строитель
                </a>
            </Menu.Item>
        </Menu>
    );

    return (
        <>
            <Dropdown  overlay={menu} trigger={['click']} >
                <a className="ant-dropdown-link" style={{color:'white'}} onClick={e => e.preventDefault()}>
                    Специальности <DownOutlined />
                </a>
            </Dropdown>
        </>)
}

export default DropdownMenuRow;