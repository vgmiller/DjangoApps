import React, { Component } from "react"
import "./App.css";

class App extends Component {
    state = {
      activeItem: {},
      perfumeList: [],
	  tagList: [],
	  currentTag: false,
	  currentPerfumeList: [],
    };

    async componentDidMount() {
      try {
        const res = await fetch('/perfume/api/perfumes/');
        const perfumeList = await res.json();
        this.setState({
          perfumeList: perfumeList,
		  currentPerfumeList: perfumeList,
        });
        const tagRes = await fetch('/perfume/api/tags/');
        const tagList = await tagRes.json();
        this.setState({
          tagList
        });
      } catch (e) {
        console.log(e);
    }
    }

    randomPerfume = () => {
      const item = this.state.perfumeList[Math.floor(Math.random()*this.state.perfumeList.length)];
      this.setState({ activeItem: item });
    };

    displayAll = () => {
      return this.setState({ currentTag: false, currentPerfumeList: this.state.perfumeList});
    };

    displayTag = tag => {
	  if (tag && tag.item) {
		  const newItems = this.state.perfumeList.filter(obj => {
				return obj.tags.includes(tag.item.id);
		  })
		  return this.setState({
					  currentTag: tag,
					  currentPerfumeList: newItems
		  });
      }
      return this.setState({ currentTag: false, currentPerfumeList: this.state.perfumeList});
    };

    
	renderTagTabs = () => {
      const tagList = this.state.tagList;
      return tagList.map(item => (
          <button 
            onClick={() => this.displayTag({item})}
          >
            {item.name}
          </button>
		  ));
	};

	renderTabList = () => {
      return (
        <div className="my-5 tab-list">
          <button 
            onClick={() => this.displayAll()}
          >
            All
          </button>
          {this.renderTagTabs()}
        </div>  
      );
    };

    renderItems = () => {
      const theItems = this.state.currentPerfumeList;
      return theItems.map(item => (
        <li 
          key={item.id}
          className="list-group-item d-flex justify-content-between align-items-center"
        >
          <p className={`perfume-description mr-2`}
      			title={item.myDescription}
          >
              {item.name}<br/>
			  <span class="small">{item.myDescription}</span>
          </p>
		  <span className="text-right" style={{alignSelf: 'flex-end'}}>{parseFloat(item.rating)} stars</span>
        </li>
      ));
    };

    render() {
      return (
        <main className="content">
        <h1 className="text-uppercase text-center my-4" style={{color:"MediumVioletRed", background:"LavenderBlush"}}>Eau du Jour</h1>
        <div className="row">
          <div className="col-md-6 col-sm-10 mx-auto p-0">
            <div className="card p-3">
              <div className="">
                <button onClick={this.randomPerfume} className="btn btn-success" title="Select a random perfume">Generate Today's Perfume!</button>
              </div>
			    <div className="text-right font-weight-bold" title={this.state.activeItem.myDescription}>
					<p className="perfume-description float-right">
						{this.state.activeItem.name}<br/>
                    	<small>{this.state.activeItem.myDescription}</small>
					</p>
				</div>
			  <hr/>
			  <div><span className="text-left">Or, browse by category:</span></div>
              {this.renderTabList()}
              <ul className="list-group list-group-flush">
                {this.renderItems()}
              </ul>
            </div>
          </div>
        </div>
      </main>
      )
    }
  }
  
export default App;
