import { Row, Col, Divider, Dropdown, Menu, Typography } from 'antd';
import { useState } from 'react';
import { DownOutlined } from '@ant-design/icons';
import DropdowmMenuRow from './DropdownMenuRow'
import StudyLine from './StudyLine';

const style = { background: 'rgb(111, 176, 240) ', color: "white", padding: '8px 20px' };



let StudyGrid = (props) => {
    const [path, setPath] = useState()

    let onClick = (e) => {
        console.log(e);
        setPath(e.key)
    }

    return (
        <>
            <Row gutter={[16, 24]}>
                {props.edus.map(item => {
                    return (
                        <Col className="gutter-row" span={6}>
                            <div style={style}><Typography.Text style={{ color: 'white' }} strong>{item}</Typography.Text> <DropdowmMenuRow onClick={onClick} /></div>
                            <div style={style}><Typography.Text style={{ color: 'white' }} underline>Хочу тут учиться</Typography.Text></div>
                        </Col>
                    )
                })}
            </Row>
            <Divider type='horizontal'/>
            <Row>
                {path!==undefined?<Col offset={10}><StudyLine path={path}/></Col>:null}
            </Row>
        </>
    )
}

export default StudyGrid

