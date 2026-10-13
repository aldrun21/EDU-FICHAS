import { WorksheetData } from '../types';

export const SAMPLE_WORKSHEETS: WorksheetData[] = [
  {
    id: 'sample-plantas',
    title: 'Las Partes de la Planta',
    subject: 'Ciencias Naturales',
    grade: '1° y 2° Primaria',
    instructions: 'Observa la ilustración de la planta y escribe el nombre de cada parte en los recuadros en blanco.',
    imageUrl: '/src/assets/images/worksheet_plantas_1791817540674.jpg',
    elements: [
      {
        id: 'elem-flor',
        type: 'text_input',
        x: 9.2,
        y: 33.8,
        width: 22.5,
        height: 6.2,
        correctAnswer: 'Flor|La flor',
        placeholder: 'Escribe aquí...',
        hint: 'Es de colores brillantes y atrae polinizadores',
        points: 2,
        fontSize: 16,
        ignoreAccents: true,
        caseSensitive: false
      },
      {
        id: 'elem-hoja',
        type: 'select_dropdown',
        x: 9.0,
        y: 48.0,
        width: 22.5,
        height: 6.2,
        correctAnswer: 'Hoja',
        options: ['Flor', 'Hoja', 'Tallo', 'Raíz'],
        placeholder: 'Selecciona...',
        hint: 'Produce alimento mediante la fotosíntesis',
        points: 2,
        fontSize: 15,
        ignoreAccents: true,
        caseSensitive: false
      },
      {
        id: 'elem-tallo',
        type: 'text_input',
        x: 69.5,
        y: 62.8,
        width: 22.5,
        height: 6.2,
        correctAnswer: 'Tallo|El tallo',
        placeholder: 'Escribe aquí...',
        hint: 'Sostiene las hojas y transporta el agua',
        points: 2,
        fontSize: 16,
        ignoreAccents: true,
        caseSensitive: false
      },
      {
        id: 'elem-raiz',
        type: 'select_dropdown',
        x: 69.8,
        y: 77.8,
        width: 22.5,
        height: 6.2,
        correctAnswer: 'Raíz',
        options: ['Raíz', 'Tallo', 'Semilla', 'Fruto'],
        placeholder: 'Selecciona...',
        hint: 'Absorbe agua y minerales de la tierra',
        points: 2,
        fontSize: 15,
        ignoreAccents: true,
        caseSensitive: false
      }
    ]
  },
  {
    id: 'sample-mates',
    title: 'Sumas y Conexiones Divertidas',
    subject: 'Matemáticas',
    grade: '2° Primaria',
    instructions: 'Resuelve las sumas en los recuadros vacíos y une con líneas cada suma con su resultado correcto.',
    imageUrl: '/src/assets/images/worksheet_mates_1791817550393.jpg',
    elements: [
      // Left side text answers
      {
        id: 'sum-1',
        type: 'text_input',
        x: 41.5,
        y: 25.0,
        width: 7.2,
        height: 4.5,
        correctAnswer: '4',
        placeholder: '?',
        points: 1,
        fontSize: 16
      },
      {
        id: 'sum-2',
        type: 'text_input',
        x: 41.5,
        y: 32.8,
        width: 7.2,
        height: 4.5,
        correctAnswer: '4',
        placeholder: '?',
        points: 1,
        fontSize: 16
      },
      {
        id: 'sum-3',
        type: 'text_input',
        x: 41.5,
        y: 40.0,
        width: 7.2,
        height: 4.5,
        correctAnswer: '5',
        placeholder: '?',
        points: 1,
        fontSize: 16
      },
      {
        id: 'sum-4',
        type: 'text_input',
        x: 41.5,
        y: 47.5,
        width: 7.2,
        height: 4.5,
        correctAnswer: '4',
        placeholder: '?',
        points: 1,
        fontSize: 16
      },
      {
        id: 'sum-5',
        type: 'text_input',
        x: 41.5,
        y: 55.0,
        width: 7.2,
        height: 4.5,
        correctAnswer: '8',
        placeholder: '?',
        points: 1,
        fontSize: 16
      },
      // Connect dots on bottom right:
      // 4 + 2 (id: dot-q1) -> 6 (id: dot-a1)
      {
        id: 'dot-q1',
        type: 'connect_dot',
        x: 68.3,
        y: 62.7,
        width: 4.5,
        height: 3.2,
        correctAnswer: 'dot-a1',
        pairId: 'pair-4plus2',
        dotRole: 'start',
        dotLabel: '4+2',
        dotColor: '#eb6281',
        points: 1
      },
      {
        id: 'dot-a1',
        type: 'connect_dot',
        x: 87.0,
        y: 62.7,
        width: 4.5,
        height: 3.2,
        correctAnswer: 'dot-q1',
        pairId: 'pair-4plus2',
        dotRole: 'end',
        dotLabel: '6',
        dotColor: '#ffcf23',
        points: 1
      },
      // 5 + 3 (id: dot-q2) -> 8 (id: dot-a2)
      {
        id: 'dot-q2',
        type: 'connect_dot',
        x: 68.3,
        y: 68.4,
        width: 4.5,
        height: 3.2,
        correctAnswer: 'dot-a2',
        pairId: 'pair-5plus3',
        dotRole: 'start',
        dotLabel: '5+3',
        dotColor: '#eb6281',
        points: 1
      },
      {
        id: 'dot-a2',
        type: 'connect_dot',
        x: 87.0,
        y: 68.4,
        width: 4.5,
        height: 3.2,
        correctAnswer: 'dot-q2',
        pairId: 'pair-5plus3',
        dotRole: 'end',
        dotLabel: '8',
        dotColor: '#52b68e',
        points: 1
      },
      // 1 + 4 (id: dot-q3) -> 5 (id: dot-a3)
      {
        id: 'dot-q3',
        type: 'connect_dot',
        x: 68.3,
        y: 74.2,
        width: 4.5,
        height: 3.2,
        correctAnswer: 'dot-a3',
        pairId: 'pair-1plus4',
        dotRole: 'start',
        dotLabel: '1+4',
        dotColor: '#eb6281',
        points: 1
      },
      {
        id: 'dot-a3',
        type: 'connect_dot',
        x: 87.0,
        y: 74.2,
        width: 4.5,
        height: 3.2,
        correctAnswer: 'dot-q3',
        pairId: 'pair-1plus4',
        dotRole: 'end',
        dotLabel: '5',
        dotColor: '#ffcf23',
        points: 1
      },
      // 6 + 1 (id: dot-q4) -> 7 (id: dot-a4)
      {
        id: 'dot-q4',
        type: 'connect_dot',
        x: 68.3,
        y: 80.0,
        width: 4.5,
        height: 3.2,
        correctAnswer: 'dot-a4',
        pairId: 'pair-6plus1',
        dotRole: 'start',
        dotLabel: '6+1',
        dotColor: '#eb6281',
        points: 1
      },
      {
        id: 'dot-a4',
        type: 'connect_dot',
        x: 87.0,
        y: 80.0,
        width: 4.5,
        height: 3.2,
        correctAnswer: 'dot-q4',
        pairId: 'pair-6plus1',
        dotRole: 'end',
        dotLabel: '7',
        dotColor: '#52b68e',
        points: 1
      }
    ]
  }
];
