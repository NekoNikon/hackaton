import { Timeline, Typography, Card, Row } from 'antd';
import { ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';

let StudyLine = (props) => {
    console.log(props);
    const [path, setPath] = useState(props.path)
    return (
        <>
            <Typography.Text style={{ marginBottom: '20px' }} strong>Timeline обучающегося</Typography.Text>
            <Row>


                <Timeline mode="right">
                    <Timeline.Item>Начало обучения</Timeline.Item>
                    <Timeline.Item>Сдача государственных экзаменов</Timeline.Item>
                    <Timeline.Item>Выбор профильных предметов ЕНТ</Timeline.Item>
                    <Timeline.Item dot={<ClockCircleOutlined className="timeline-clock-icon" />} color="green" >Выбор специальности</Timeline.Item>
                    <Timeline.Item dot={props.path == 2 ? <CloseCircleOutlined /> : <ClockCircleOutlined />} color={props.path == 2 ? "red" : "grey"}>Начало профильного обучения</Timeline.Item>
                </Timeline>
                <Card style={{marginLeft:'20px', width: 300 }}>
                    {props.path != 2 ?<p>С учетом анализа интересов, успеваемости и
                    выбранных профильных предметов, данная специальность
                    может быть расмотренна как предпочтительная</p>:
                    <p>На основе проведенного анализа ваших интересов и достижений в учебе,
                    данная специальность является менее предпочтительной.
                    Но вы можете воспользоваться курсами и материалами из раздела рекомендаций,
                    которые помогут подготовится к поступлению на выбранную специальность</p>
                    }
                </Card>
            </Row>
        </>

    )
}

export default StudyLine
