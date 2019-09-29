import { Draggable, Droppable } from 'react-beautiful-dnd';
import FocusIcon from '../../../../res/Focus.svg';
import DoneIcon from '../../../../res/done.svg';
import React, { FC, useRef, useState } from 'react';
import { List as ListType, ListActionTypes } from './action';
import styled from 'styled-components';
import Card from '../Card';
import { Button, Dropdown, Icon, Input, Menu, message, Popconfirm, Tooltip } from 'antd';
import { KanbanActionTypes } from '../action';
import { CardsState } from '../Card/action';

const Container = styled.div`
    padding: 4px;
    margin: 6px;
    border-radius: 6px;
    background-color: white;
`;

const ListHead = styled.div`
    height: 4em;
    min-width: 250px;
    padding: 4px 12px;
    background-color: white;
    border-radius: 6px;
    position: relative;

    h1 {
        font-size: 18px;
        margin: 0;
    }

    .list-head-text {
        position: absolute;
        top: 24px;
        transform: translateY(-50%);
        left: 8px;
    }

    .list-head-icon {
        position: absolute;
        top: 20px;
        transform: translateY(-50%);
        right: 8px;
        cursor: pointer;
    }

    .list-head-icon i:hover {
        color: #0074d9;
    }
`;

const Cards = styled.div`
    position: relative;
    padding: 0 2px;
    background-color: #dedede;
    border-radius: 4px;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
    min-height: 200px;
    max-width: 270px;
`;

const ButtonPlaceHolder = styled.div`
    position: sticky;
    bottom: 0;
    height: 32px;
`;

const ButtonWrapper = styled.div`
    text-align: center;
    position: absolute;
    transform: translateX(-50%);
    left: 50%;
    bottom: 0;
    display: flex;
    justify-content: center;
    background-color: #dedede;
    border-radius: 0 0 4px 4px;
`;

export interface InputProps {
    listId: string;
    index: number;
    boardId: string;
    focused?: boolean;
    done?: boolean;
}

interface Props extends ListType, InputProps, ListActionTypes, KanbanActionTypes {
    searchReg?: string;
    cardsState: CardsState;
}

export const List: FC<Props> = (props: Props) => {
    const { focused = false, searchReg, cards, cardsState, done = false } = props;
    const [estimatedTimeSum, actualTimeSum] = props.cards.reduce(
        (l: [number, number], r: string) => {
            return [
                l[0] + props.cardsState[r].spentTimeInHour.estimated,
                l[1] + props.cardsState[r].spentTimeInHour.actual
            ] as [number, number];
        },
        [0, 0] as [number, number]
    );
    const overallTimeInfo = `${actualTimeSum.toFixed(1)}h / ${estimatedTimeSum.toFixed(1)}h`;
    const filteredCards =
        searchReg === undefined
            ? cards
            : cards.filter(id => {
                const card = cardsState[id];
                return card.title.match(searchReg) || card.content.match(searchReg);
            });

    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState('');
    const inputRef = useRef<Input>();

    const addCard = () => {
        props.setEditCard(true, props.listId, undefined);
    };

    const onDelete = () => {
        if (props.focused) {
            message.warn('Cannot delete the focused list.');
            return;
        }

        props.deleteList(props._id, props.boardId);
    };

    const onSave = () => {
        props.renameList(props._id, value);
        setIsEditing(false);
    };

    const onValueChange = (e: any) => {
        setValue(e.target.value);
    };

    const onEdit = () => {
        setValue(props.title);
        setIsEditing(true);
        if (!inputRef.current) {
            return;
        }

        inputRef.current.focus();
    };

    const menu = (
        <Menu>
            <Menu.Item key="1" onClick={onEdit}>
                <Icon type={'setting'} /> Edit
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item key="3">
                <Popconfirm title={'Are you sure?'} onConfirm={onDelete}>
                    <Icon type={'delete'} /> Delete
                </Popconfirm>
            </Menu.Item>
        </Menu>
    );

    return (
        <Draggable draggableId={props.listId} index={props.index}>
            {(provided, { draggingOver }) => (
                <div>
                    <Container
                        ref={provided.innerRef}
                        className={'kanban-list'}
                        id={props.focused ? 'focused-list' : props.done ? 'done-list' : undefined}
                        {...provided.draggableProps}
                    >
                        <ListHead {...provided.dragHandleProps}>
                            {isEditing ? (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <Input maxLength={25} value={value} onChange={onValueChange} />
                                    <Button onClick={onSave}>Save</Button>
                                </div>
                            ) : (
                                <>
                                    <span className="list-head-text">
                                        <h1>{props.title}</h1>
                                        <span>{overallTimeInfo}</span>
                                    </span>
                                    <div className="list-head-icon">
                                        {focused ? (
                                            <Tooltip title={'Focused column'}>
                                                <span style={{ color: 'red', marginRight: 8 }}>
                                                    <Icon component={FocusIcon} />
                                                </span>
                                            </Tooltip>
                                        ) : (
                                            undefined
                                        )}
                                        {done ? (
                                            <Tooltip title={'Done column'}>
                                                <span style={{ color: 'green', marginRight: 8 }}>
                                                    <Icon component={DoneIcon} />
                                                </span>
                                            </Tooltip>
                                        ) : (
                                            undefined
                                        )}
                                        <Dropdown overlay={menu} trigger={['click']}>
                                            <Icon type="menu" />
                                        </Dropdown>
                                    </div>
                                </>
                            )}
                        </ListHead>
                        <Droppable droppableId={props._id}>
                            {(provided, { isDraggingOver }) => (
                                <Cards ref={provided.innerRef}>
                                    {filteredCards.map((cardId, index) => (
                                        <Card
                                            cardId={cardId}
                                            index={index}
                                            key={cardId}
                                            listId={props.listId}
                                            isDraggingOver={isDraggingOver}
                                        />
                                    ))}
                                    {provided.placeholder}
                                    <ButtonPlaceHolder />
                                    <ButtonWrapper>
                                        <Button
                                            onClick={addCard}
                                            shape={'circle'}
                                            icon="plus"
                                            id={'create-card-button'}
                                        />
                                    </ButtonWrapper>
                                </Cards>
                            )}
                        </Droppable>
                    </Container>
                    {provided.placeholder}
                </div>
            )}
        </Draggable>
    );
};
