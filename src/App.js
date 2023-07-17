import React from "react";
import mondaySdk from "monday-sdk-js";
import ReactWordcloud from "react-wordcloud";
import { AttentionBox } from "monday-ui-react-core";
import "monday-ui-react-core/dist/main.css";
import { stopWords } from "./stop-words";
import _ from "lodash";
import "./index.css"

const monday = mondaySdk();

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      settings: {},
      context: {},
      boards: [],
      // words: [],
      // itemIds: false,
      serverData: {},
      hasNoBoards: false,
      hasApiError: false,
      loading: false,
      gurulogin: false,
    };
  }

  componentDidMount() {
    // monday.listen("settings", this.getSettings);
    monday.listen("context", this.setContext);
    // monday.listen("itemIds", this.getItemIds);
  }

  getSettings = (res) => {
    this.setState({ settings: res.data });
    console.log("settings!", res.data);
    this.generateWords();
  };

  getItemIds = (res) => {
    const itemIds = {};
    res.data.forEach((id) => (itemIds[id] = true));
    this.setState({ itemIds: itemIds });
    this.generateWords();
  };

  setLoginGuru = () => {
    monday.execute('openLinkInTab', { url: 'https://app.getguru.com/signin' });
  }

  anotherFunc = () => {
    this.setLoginGuru();
    const context = this.state.context;
    console.log("TestContext", context);
    // if (this.gurulogin.state?.status === 'login') {

      const boardIds = context.boardIds || [context.boardId];
      monday
        .api(`query { boards(ids:[${boardIds}]) { id, items { id, name, column_values { id, text } } }}`)
        .then(async (res) => {

          const noBoardsReturned = res.data.boards.length === 0;
          if (noBoardsReturned) {
            // no boards returned
            this.setState({ hasNoBoards : true })
          } else {
            console.log(res.data.boards[0].items.slice(0, 10).map((item) => item.id));
            const response = await this.exportBoardObject(res);
            this.setState( { serverData: response});

            // this.setState({ boards: res.data.boards, hasNoBoards: false,  hasApiError: false }, async () => {
            //   console.log(res.data.boards[0].items.slice(0, 10).map((item) => item.id));
            //   // this.generateWords();
            //   await this.exportBoardObject(res);
            // });
          }
        })
        .catch((err) => {
          if (err.message === 'Graphql validation errors') {
            this.setState({ hasApiError : true });
          }
        });

  }

  setContext = (res) => {
    const context = res.data;
    console.log("context!", context);
    this.setState({ context });
  };

  generateWords = () => {
    const words = this.getWords();
    console.log("words", words);
    this.setState({ words });
  };

  exportBoardObject = async (resultsAPI) => {
    console.log(resultsAPI)
    //   set loading state to true when the request starts
    this.setState({ loading: true });

    // const sendRequest = async () => {
    try {
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tabledata : resultsAPI
          })
      };
      const response = await fetch('https://guruai-backend-z24e7lyyxa-uc.a.run.app:5000/api/endpoint/api/endpoint', requestOptions);
      const responseData = await response.json();
      console.log(responseData);
      
      // set loading state to false when the request completes
      this.setState({ loading: false });

      return responseData;
    } catch (error) {
      console.error('Error:', error);
      // set loading state to false when the request completes, even if it failed
      this.setState({ loading: false });
    }
    // };
    // return (
    //   <div>
    //     <button onClick={sendRequest}>Send Request</button>
    //     {response && (
    //       <div>
    //         <p>Status: {response.status}</p>
    //         <p>Message: {response.message}</p>
    //       </div>
    //     )}
    //   </div>
    // );
  }

  getWords = () => {
    const text = this.getText();
    const lines = text.split(/[,. ]+/g);

    const wordsMap = {};
    lines.forEach((word) => {
      word = word.toLowerCase().trim();
      if (!wordsMap[word]) wordsMap[word] = 0;
      wordsMap[word] += 1;
    });

    const words = [];
    Object.keys(wordsMap).map((word) => {
      if (word && word.length > 2 && wordsMap[word] && !stopWords[word]) {
        words.push({ text: word, value: wordsMap[word] });
      }
      return word;
    });
    return words;
  };

  getText = () => {
    const { boards, settings, itemIds } = this.state;
    const result = boards.map((board) => {
      return board.items
        .filter((item) => !itemIds || itemIds[item.id])
        .map((item) => {
          let columnIds, values;
          if (settings.column) columnIds = Object.keys(settings.column);

          if (columnIds && columnIds.length > 0) {
            const columnValues = item.column_values.filter((cv) => {
              return columnIds.includes(cv.id);
            });
            values = columnValues
              .map((cv) => cv.text)
              .filter((t) => t && t.length > 0)
              .join(" ");

            if (columnIds.includes("name")) values += item.name;
            return values;
          } else {
            return item.name;
          }
        });
    });
    return _.flatten(result).join(" ");
  };

  maxWords = () => {
    const { settings } = this.state;
    return settings.maxWords ? parseInt(settings.maxWords) : 100;
  };

  padding = () => {
    const { settings } = this.state;
    return settings.padding ? parseInt(settings.padding) : 10;
  };

  contentToRender = () => {
    const { words, hasNoBoards,  hasApiError } = this.state;
    if (hasNoBoards) {
      return (
          <AttentionBox 
            title="No boards connected" 
            text="Please connect a board to continue." 
            type={AttentionBox.types.DANGER}
          />
      )
    }
    if (hasApiError) {
      return (
          <AttentionBox 
            title="GraphQL API error" 
            text="Please check the browser console for more details." 
            type={AttentionBox.types.DANGER}
          />
      )
    }
    return (
        <ReactWordcloud
          words={words}
          maxWords={this.maxWords()}
          options={{
            fontFamily: "Roboto",
            fontSizes: [18, 36],
            fontWeight: 700,
            deterministic: true,
            colors: colors,
            padding: this.padding()
            // spiral: "archimedean"
          }}
        />
    );
  }

  myFunc = () => {
    monday.execute('openLinkInTab', { url: this.state.serverData.link });  
  }
  render() {
    if (this.state.serverData?.status === 'success') {
      //monday.execute('openLinkInTab', { url: this.state.serverData.link });
      // monday.execute('openLinkInTab', { url: 'https://app.getguru.com/collections/jr3n7/Monday-Software-development-Board' });
      // monday.execute('openLinkInTab', { url: 'https://app.getguru.com/signin' });
      // monday.execute("closeAppFeatureModal");
    }
    return (
      <div className="monday-app">
        <div className="app-message">
        <span className="first-line">Hey user, Press this button to sign in to your GURU account</span>
          <button className="sign-in-btn" onClick={this.anotherFunc}>Sign in</button>
          <span className="second-line">After you are logged in, go ahead and press this buttoon to be redirected to your output GURU doc</span>


          <button className="btn" onClick={this.myFunc}>Im logged in show me the doc</button>
        </div>
      </div>
  )
  }
}

export default App;

const colors = [
  "#fdab3d",
  "#00c875",
  "#e2445c",
  "#0086c0",
  "#579bfc",
  "#a25ddc",
  "#037f4c",
  "#CAB641",
  "#FFCB00",
  "#BB3354",
  "#FF158A",
  "#FF5AC4",
  "#784BD1",
  "#9CD326",
  "#66CCFF",
  "#7F5347",
  "#FF642E"
];
