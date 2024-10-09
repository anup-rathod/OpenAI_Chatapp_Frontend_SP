import * as React from 'react';
import styles from './Frontend.module.scss';
import type { IFrontendProps } from './IFrontendProps';
import { escape } from '@microsoft/sp-lodash-subset';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { spfi, SPFx } from "@pnp/sp";

export interface IFrontendState {
  data: any[];
  prompt: string;
  response: string;
  loading: boolean;
  error: string | null;
}

export default class Frontend extends React.Component<IFrontendProps, IFrontendState> {
  constructor(props: IFrontendProps) {
    super(props);
    this.state = {
      data: [],
      prompt: '',
      response: '',
      loading: false,
      error: null,
    };
  }

  // Method to handle input change
  private handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ prompt: event.target.value });
  };

  // Method to send the prompt to the backend
  private sendPrompt = async () => {
    const { prompt } = this.state;
    this.setState({ loading: true, error: null });

    try {
      const response = await fetch('https://chatdev-dqetdkc5dvfgbwd9.eastus-01.azurewebsites.net/api/send-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response from the backend.');
      }

      const data = await response.json();
      console.log('Data received:', data); 
      this.setState({ response: data.response, loading: false });
    } catch (error) {
      console.error('Error:', error); 
      this.setState({ error: error.message, loading: false });
    }
  };

  componentDidMount() {
    this.getListData();
  }

  // Inventory list
  private getListData = async () => {
    try {
      const sp = spfi().using(SPFx(this.props.context));
      const list = sp.web.lists.getByTitle("Inventory list");
      const itemsResponse = await list.items.select("DeviceID","AssignedUser","DeviceNames","Price")();
      console.log(itemsResponse) 

      // Send the fetched data to the backend
    this.sendListDataToBackend(itemsResponse);
      this.setState({ data: itemsResponse });
    } catch (error) {
      console.error("Error fetching data from the list: ", error);
    }
  };

  // Method to send list data to backend
private sendListDataToBackend = async (data: any[]) => {
  try {
    const response = await fetch('https://chatdev-dqetdkc5dvfgbwd9.eastus-01.azurewebsites.net/api/send-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ listData: data }),
    });

    if (!response.ok) {
      throw new Error('Failed to send SharePoint data to backend.');
    }

    const result = await response.json();
    console.log('Data sent to backend successfully:', result);
  } catch (error) {
    console.error('Error sending SharePoint data to backend:', error);
  }
};


  public render(): React.ReactElement<IFrontendProps> {
    const { description } = this.props;
    const { data } = this.state;
    const { prompt, response, loading, error } = this.state;

    return (
      <div className={styles.frontend}>
        <h1>Ask the AI</h1>

        {/* Input for the user prompt */}
        <input
          type="text"
          value={prompt}
          onChange={this.handleInputChange}
          placeholder="Enter your prompt"
        />

        {/* Button to send the prompt */}
        <button onClick={this.sendPrompt} disabled={loading}>
          {loading ? 'Processing...' : 'Send Prompt'}
        </button>

        {/* Display response or error */}
        {response && <p>{response}</p>}
        {error && <p>Error: {error}</p>}
        {/*New*/}
        <div>
        {Array.isArray(data) && data.length > 0 ? (
          data.map((item) => {
            if (item.Active === true) {
              return (
                <div key={item.Id}>
                  <p>{item.Content}</p>
                </div>
              );
            } else {
              return null;
            }
          })
        ) : (
          <p>No active items found.</p>
        )}
      </div>
      </div>
    );
  }
}
